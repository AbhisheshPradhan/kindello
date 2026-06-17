"""Geocode the ACECQA services against G-NAF — disk-light, no bulk DB load.

Bulk-loading all ~16M G-NAF addresses into Postgres needs more disk than we
have locally, and we only need lat/lng for ~18k centres. So instead we stream
the G-NAF PSVs once and keep only the rows that match a centre address.

Match key = (postcode, normalised-full-street, street-number). We reconstruct
the full street string ("Royalty St" -> "ROYALTY STREET") so abbreviation vs
full-word differences between ACECQA and G-NAF don't break matching.

Two tiers, best first:
  1. exact  : (postcode, street, number)  -> building-level coordinate
  2. street : (postcode, street)          -> any point on that street (used when
              the address has no number, or the exact number isn't in G-NAF)

Writes services.latitude / longitude / last_geocoded_at and prints a match report.

Usage:
  python geocode_gnaf.py            # geocode all services missing coordinates
  python geocode_gnaf.py --all      # re-geocode every service
"""
from __future__ import annotations

import argparse
import csv
import glob
import os
import re
import sys
import time
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
PSV_DIR = ROOT / "data" / "raw" / "gnaf_psv"
DATABASE_URL = os.getenv("DATABASE_URL")
csv.field_size_limit(10 * 1024 * 1024)

# Street-type abbreviation -> G-NAF full word. Full words map to themselves so a
# normalised string is produced whether ACECQA used "St", "STREET", etc.
TYPE_MAP = {
    "ST": "STREET", "RD": "ROAD", "AVE": "AVENUE", "AV": "AVENUE", "DR": "DRIVE",
    "DRV": "DRIVE", "CT": "COURT", "CRT": "COURT", "PL": "PLACE", "CR": "CRESCENT",
    "CRES": "CRESCENT", "CL": "CLOSE", "LN": "LANE", "HWY": "HIGHWAY", "PDE": "PARADE",
    "TCE": "TERRACE", "TER": "TERRACE", "BVD": "BOULEVARD", "BLVD": "BOULEVARD",
    "CCT": "CIRCUIT", "CIR": "CIRCUIT", "GR": "GROVE", "GRV": "GROVE", "WY": "WAY",
    "ESP": "ESPLANADE", "PKWY": "PARKWAY", "SQ": "SQUARE", "CWY": "CAUSEWAY",
    "PROM": "PROMENADE", "RES": "RESERVE", "RDG": "RIDGE", "GLD": "GLADE",
}
FULL_TYPES = set(TYPE_MAP.values())

# Leading sub-dwelling prefixes that hide the real street number (Unit 4 29 …).
_UNIT = re.compile(r"^(?:UNIT|UNITS|U|SHOP|SHOPS|FACTORY|SUITE|STUDIO|KIOSK|FLAT|APT|"
                   r"APARTMENT|VILLA|SECTION|SEC|TENANCY|OFFICE)S?\b\.?\s*\d*[A-Z]?\s*")
_LOT = re.compile(r"^LOTS?\b\.?\s*\d*[A-Z]?\s*")        # Lot numbers aren't street numbers
_SLASH = re.compile(r"^\d+[A-Z]?\s*/\s*(\d+)[A-Z]?\s+(.*)$")   # 26/9 Hollinsworth Rd -> 9
_NUM = re.compile(r"^(\d+)[A-Z]?(?:\s*-\s*\d+[A-Z]?)?\b\s*(.*)$")


def _street(rest: str) -> str | None:
    """Normalise the street-type word in a 'NAME TYPE' string (Royalty St -> ROYALTY STREET)."""
    tokens = rest.split()
    if not tokens:
        return None
    last = tokens[-1]
    if last in TYPE_MAP and last not in FULL_TYPES:
        return " ".join(tokens[:-1] + [TYPE_MAP[last]])
    return rest                            # already full type, or unknown type


def _parse_seg(seg: str) -> tuple[int | None, str | None]:
    seg = _UNIT.sub("", seg).strip()
    seg = _LOT.sub("", seg).strip()
    m = _SLASH.match(seg)                  # unit/street form -> take street number after '/'
    if m:
        return int(m.group(1)), _street(m.group(2).strip())
    m = _NUM.match(seg)
    if m and m.group(2):
        return int(m.group(1)), _street(m.group(2).strip())
    return None, _street(seg)              # no street number


def parse_address(addr: str) -> tuple[int | None, str | None]:
    """ACECQA address -> (street_number, normalised full street) e.g. (52, 'ALFRED HILL DRIVE').

    Addresses mix two comma layouts — "building, street" and "street, suburb" — so
    we pick the comma-segment that actually yields a street number; failing that,
    the last segment (a street with no number).
    """
    if not addr:
        return None, None
    a = re.sub(r"\s+", " ", addr.upper()).strip()
    segments = [s.strip() for s in a.split(",") if s.strip()]
    for seg in segments:
        num, street = _parse_seg(seg)
        if num is not None and street:
            return num, street             # first numbered segment wins
    if segments:
        return _parse_seg(segments[-1])    # no number anywhere — street-level on last segment
    return None, None


def gnaf_files(suffix: str) -> list[str]:
    files = sorted(glob.glob(str(PSV_DIR / f"*_{suffix}")))
    if not files:
        sys.exit(f"No *_{suffix} files in {PSV_DIR}")
    return files


def load_street_dict() -> dict[str, str]:
    """street_locality_pid -> normalised full street string."""
    d: dict[str, str] = {}
    for path in gnaf_files("STREET_LOCALITY_psv.psv"):
        with open(path, newline="", encoding="utf-8") as fh:
            r = csv.reader(fh, delimiter="|")
            next(r)
            for row in r:
                if row[2]:                 # DATE_RETIRED
                    continue
                name, stype = row[4].strip().upper(), row[5].strip().upper()
                d[row[0]] = f"{name} {stype}".strip() if stype else name
    return d


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="re-geocode every service")
    args = ap.parse_args()
    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set (ingest/.env).")

    with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        where = "" if args.all else "WHERE latitude IS NULL"
        cur.execute(f"SELECT service_approval_number, service_address, postcode FROM services {where};")
        services = cur.fetchall()
        print(f"Geocoding {len(services):,} services ...")

        # Build target lookups from the centre addresses.
        tgt_exact: dict[tuple, list[str]] = {}   # (postcode, street, number) -> [sid]
        tgt_street: dict[tuple, list[str]] = {}  # (postcode, street)         -> [sid]
        parsed = 0
        for sid, addr, pc in services:
            num, street = parse_address(addr)
            if not (pc and street):
                continue
            parsed += 1
            tgt_street.setdefault((pc, street), []).append(sid)
            if num is not None:
                tgt_exact.setdefault((pc, street, num), []).append(sid)
        print(f"  parsed a usable street for {parsed:,} of them")

        street_dict = load_street_dict()
        print(f"  loaded {len(street_dict):,} G-NAF streets")

        # Stream ADDRESS_DETAIL once; record the pid that matches each service.
        exact_pid: dict[str, str] = {}
        street_pid: dict[str, str] = {}
        t0 = time.time()
        for path in gnaf_files("ADDRESS_DETAIL_psv.psv"):
            with open(path, newline="", encoding="utf-8") as fh:
                r = csv.reader(fh, delimiter="|")
                next(r)
                for row in r:
                    if row[3] or row[25] != "P":      # retired, or non-principal alias
                        continue
                    street = street_dict.get(row[22])
                    if not street:
                        continue
                    pc = row[26]
                    pid = row[0]
                    sk = (pc, street)
                    if sk in tgt_street:
                        for sid in tgt_street[sk]:
                            street_pid.setdefault(sid, pid)
                        if row[17]:                    # NUMBER_FIRST present
                            ek = (pc, street, int(row[17]))
                            if ek in tgt_exact:
                                for sid in tgt_exact[ek]:
                                    exact_pid[sid] = pid
        print(f"  scanned ADDRESS_DETAIL ({time.time() - t0:.0f}s); "
              f"exact={len(exact_pid):,} street={len(street_pid):,}")

        # Resolve best pid per service (exact preferred), collect the pids we need.
        chosen: dict[str, tuple[str, str]] = {}   # sid -> (pid, tier)
        for sid, _, _ in services:
            if sid in exact_pid:
                chosen[sid] = (exact_pid[sid], "exact")
            elif sid in street_pid:
                chosen[sid] = (street_pid[sid], "street")
        needed = {pid for pid, _ in chosen.values()}

        # Stream the geocodes once for just the pids we matched.
        coords: dict[str, tuple[str, str]] = {}
        t0 = time.time()
        for path in gnaf_files("ADDRESS_DEFAULT_GEOCODE_psv.psv"):
            with open(path, newline="", encoding="utf-8") as fh:
                r = csv.reader(fh, delimiter="|")
                next(r)
                for row in r:
                    if row[3] in needed and not row[2]:   # pid matched, not retired
                        coords[row[3]] = (row[6], row[5])  # (LATITUDE, LONGITUDE)
        print(f"  pulled {len(coords):,} coordinates ({time.time() - t0:.0f}s)")

        # Write back.
        updates = [
            (lat, lng, sid)
            for sid, (pid, _) in chosen.items()
            if (c := coords.get(pid)) for lat, lng in [c]
        ]
        cur.executemany(
            "UPDATE services SET latitude=%s, longitude=%s, last_geocoded_at=now() "
            "WHERE service_approval_number=%s",
            updates,
        )
        conn.commit()

        tiers = {"exact": 0, "street": 0}
        for _, t in chosen.values():
            tiers[t] += 1
        total = len(services)
        print(f"\nGeocoded {len(updates):,}/{total:,} ({100*len(updates)/total:.1f}%)  "
              f"[exact={tiers['exact']:,}, street-level={tiers['street']:,}]")


if __name__ == "__main__":
    main()
