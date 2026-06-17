"""Load the ACECQA National Registers CSVs into Postgres (Tier 1 "spine").

Reads the national exports downloaded into data/raw/ (see download notes in
CLAUDE.md), transforms them to typed values, and upserts into the `providers`
and `services` tables defined in schema.sql.

Upserts are source-of-truth-overwriting for spine columns but PRESERVE the
Tier-2 enrichment columns (latitude/longitude/last_geocoded_at) on conflict —
so re-running the daily sync never clobbers geocoding/enrichment work.

Usage:
  python load.py                 # apply schema (idempotent) then load both files
  python load.py --no-schema     # skip schema apply, just load
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path

import psycopg
from dotenv import load_dotenv
import os

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
SCHEMA_SQL = Path(__file__).resolve().parent / "schema.sql"
SERVICES_CSV = RAW_DIR / "acecqa-services-au.csv"
PROVIDERS_CSV = RAW_DIR / "acecqa-providers-au.csv"

DATABASE_URL = os.getenv("DATABASE_URL")

# CSV has no embedded NULs but some fields are huge (Conditions); bump the limit.
csv.field_size_limit(10 * 1024 * 1024)


# --- value transforms -------------------------------------------------------

def _clean(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    return v or None


def parse_date(v: str | None):
    """DD/MM/YYYY -> date, else None."""
    v = _clean(v)
    if not v:
        return None
    try:
        return datetime.strptime(v, "%d/%m/%Y").date()
    except ValueError:
        return None


def parse_bool(v: str | None):
    v = _clean(v)
    if v is None:
        return None
    return v.lower() == "yes"


def parse_int(v: str | None):
    v = _clean(v)
    if not v:
        return None
    try:
        return int(v)
    except ValueError:
        return None


# Operating-hours columns are fixed-position blocks of 14 (7 days x start/end).
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
HOURS_BLOCKS = {
    "annual": 41,                  # cols 41..54
    "school_terms_session_1": 55,  # cols 55..68
    "school_terms_session_2": 69,  # cols 69..82
    "holiday_care": 83,            # cols 83..96
}


def build_operating_hours(row: list[str]) -> dict | None:
    out: dict = {}
    for block, base in HOURS_BLOCKS.items():
        days = {}
        for i, day in enumerate(DAYS):
            start = _clean(row[base + i * 2])
            end = _clean(row[base + i * 2 + 1])
            if start or end:
                days[day] = {"start": start, "end": end}
        if days:
            out[block] = days
    return out or None


# --- loaders ----------------------------------------------------------------

PROVIDER_UPSERT = """
INSERT INTO providers (
    provider_approval_number, service_approval_number, legal_name, trading_name,
    address, suburb, state, postcode, date_approval_granted, conditions, last_synced_at
) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now())
ON CONFLICT (provider_approval_number) DO UPDATE SET
    service_approval_number = EXCLUDED.service_approval_number,
    legal_name              = EXCLUDED.legal_name,
    trading_name            = EXCLUDED.trading_name,
    address                 = EXCLUDED.address,
    suburb                  = EXCLUDED.suburb,
    state                   = EXCLUDED.state,
    postcode                = EXCLUDED.postcode,
    date_approval_granted   = EXCLUDED.date_approval_granted,
    conditions              = EXCLUDED.conditions,
    last_synced_at          = now();
"""

SERVICE_COLS = [
    "service_approval_number", "provider_approval_number", "service_name",
    "provider_legal_name", "service_type", "service_address", "suburb", "state",
    "postcode", "phone", "fax", "conditions_on_approval", "number_of_approved_places",
    "service_approval_granted_date",
    "quality_area_1_rating", "quality_area_2_rating", "quality_area_3_rating",
    "quality_area_4_rating", "quality_area_5_rating", "quality_area_6_rating",
    "quality_area_7_rating", "overall_rating", "ratings_issued",
    "previous_quality_area_1_rating", "previous_quality_area_2_rating",
    "previous_quality_area_3_rating", "previous_quality_area_4_rating",
    "previous_quality_area_5_rating", "previous_quality_area_6_rating",
    "previous_quality_area_7_rating", "previous_overall_rating", "previous_ratings_issued",
    "last_service_approval_transfer_date", "last_visit_date",
    "is_long_day_care", "is_preschool_part_of_school", "is_preschool_stand_alone",
    "is_oshc_after_school", "is_oshc_before_school", "is_oshc_vacation_care",
    "is_other_type", "temporarily_closed", "operating_hours",
]
# Spine columns updated on conflict (everything except the PK and enrichment cols).
_SVC_UPDATE = ",\n    ".join(f"{c} = EXCLUDED.{c}" for c in SERVICE_COLS[1:])
SERVICE_UPSERT = f"""
INSERT INTO services ({", ".join(SERVICE_COLS)}, last_synced_at)
VALUES ({", ".join(["%s"] * len(SERVICE_COLS))}, now())
ON CONFLICT (service_approval_number) DO UPDATE SET
    {_SVC_UPDATE},
    last_synced_at = now();
"""


def service_row_to_values(r: list[str]) -> tuple:
    hours = build_operating_hours(r)
    return (
        _clean(r[0]),                       # service_approval_number
        _clean(r[1]),                       # provider_approval_number
        _clean(r[2]), _clean(r[3]), _clean(r[4]), _clean(r[5]), _clean(r[6]),
        _clean(r[7]), _clean(r[8]), _clean(r[9]), _clean(r[10]), _clean(r[11]),
        parse_int(r[12]),                   # number_of_approved_places
        parse_date(r[13]),                  # service_approval_granted_date
        *[_clean(r[i]) for i in range(14, 23)],   # QA1-7, overall, ratings_issued
        *[_clean(r[i]) for i in range(23, 32)],   # previous QA1-7, overall, issued
        parse_date(r[32]),                  # last_service_approval_transfer_date
        _clean(r[33]),                      # last_visit_date
        parse_bool(r[34]), parse_bool(r[35]), parse_bool(r[36]), parse_bool(r[37]),
        parse_bool(r[38]), parse_bool(r[39]), parse_bool(r[40]),
        parse_bool(r[97]),                  # temporarily_closed
        json.dumps(hours) if hours else None,
    )


def load_providers(cur) -> int:
    with open(PROVIDERS_CSV, newline="", encoding="utf-8-sig") as fh:
        reader = csv.reader(fh)
        next(reader)  # header
        rows = [
            (
                _clean(r[0]), _clean(r[1]), _clean(r[2]), _clean(r[3]), _clean(r[4]),
                _clean(r[5]), _clean(r[6]), _clean(r[7]), parse_date(r[8]), _clean(r[9]),
            )
            for r in reader if _clean(r[0])
        ]
    cur.executemany(PROVIDER_UPSERT, rows)
    return len(rows)


# Some services reference a provider# absent from the providers export (very
# new/recently-changed providers). Create stub provider rows so the FK holds and
# no service is dropped; ON CONFLICT DO NOTHING leaves real providers untouched.
PROVIDER_STUB = """
INSERT INTO providers (provider_approval_number, legal_name)
VALUES (%s, %s)
ON CONFLICT (provider_approval_number) DO NOTHING;
"""


def load_services(cur) -> int:
    with open(SERVICES_CSV, newline="", encoding="utf-8-sig") as fh:
        reader = csv.reader(fh)
        next(reader)  # header
        raw = [r for r in reader if _clean(r[0])]

    stubs = {_clean(r[1]): _clean(r[3]) for r in raw if _clean(r[1])}  # provider# -> legal name
    cur.executemany(PROVIDER_STUB, list(stubs.items()))

    rows = [service_row_to_values(r) for r in raw]
    cur.executemany(SERVICE_UPSERT, rows)
    return len(rows)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-schema", action="store_true", help="skip applying schema.sql")
    args = ap.parse_args()

    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set (ingest/.env).")
    for f in (PROVIDERS_CSV, SERVICES_CSV):
        if not f.exists():
            sys.exit(f"Missing CSV: {f} — download it first.")

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            if not args.no_schema:
                print("Applying schema.sql ...")
                cur.execute(SCHEMA_SQL.read_text())
            print("Loading providers ...")
            np = load_providers(cur)
            print(f"  upserted {np:,} providers")
            print("Loading services ...")
            ns = load_services(cur)
            print(f"  upserted {ns:,} services")
        conn.commit()
    print("Done.")


if __name__ == "__main__":
    main()
