"""Load the relevant slice of G-NAF into Postgres and flatten it to an
address -> lat/lng lookup table (`gnaf_address`).

G-NAF (Geoscape, open data via data.gov.au, quarterly) ships as per-state
pipe-separated tables. To geocode an address we only need four of them:

    ADDRESS_DETAIL          number + links to street/locality + postcode
    ADDRESS_DEFAULT_GEOCODE address_detail_pid -> latitude/longitude
    STREET_LOCALITY         street name + type
    LOCALITY                suburb/locality name

We stream just the columns we need (skipping retired rows) into lean staging
tables via COPY, then join them into `gnaf_address` with indexes for matching.
This is reusable infrastructure: a full national address->coordinate table
(~15M rows) usable for any future geocoding, not just the childcare centres.

Usage:
  python gnaf_load.py          # expects extracted PSVs in data/raw/gnaf_psv/
"""
from __future__ import annotations

import csv
import glob
import os
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

# (staging table, filename suffix, target columns, source col indexes, retired-col index)
TABLES = [
    ("gnaf_addr",  "ADDRESS_DETAIL_psv.psv",
     ["address_detail_pid", "number_first", "street_locality_pid", "locality_pid", "postcode"],
     [0, 17, 22, 24, 26], 3, 25),   # last two: retired_idx=3, alias_idx=25 (keep 'P' only)
    ("gnaf_geo",   "ADDRESS_DEFAULT_GEOCODE_psv.psv",
     ["address_detail_pid", "longitude", "latitude"],
     [3, 5, 6], 2, None),
    ("gnaf_street", "STREET_LOCALITY_psv.psv",
     ["street_locality_pid", "street_name", "street_type"],
     [0, 4, 5], 2, None),
    ("gnaf_loc",   "LOCALITY_psv.psv",
     ["locality_pid", "locality_name"],
     [0, 3], 2, None),
]


def rows_from(path: str, idxs: list[int], retired_idx: int, alias_idx: int | None):
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter="|")
        next(reader)  # header
        for r in reader:
            if r[retired_idx]:                      # skip retired records
                continue
            if alias_idx is not None and r[alias_idx] != "P":  # principal addresses only
                continue
            yield tuple(r[i] for i in idxs)


def load_staging(cur) -> None:
    for table, suffix, cols, idxs, retired_idx, alias_idx in TABLES:
        files = sorted(glob.glob(str(PSV_DIR / f"*_{suffix}")))
        if not files:
            sys.exit(f"No files matching *_{suffix} in {PSV_DIR}")
        coldefs = ", ".join(f"{c} text" for c in cols)
        cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
        cur.execute(f"CREATE TABLE {table} ({coldefs});")
        n = 0
        t0 = time.time()
        copy_sql = f"COPY {table} ({', '.join(cols)}) FROM STDIN"
        with cur.copy(copy_sql) as cp:
            for path in files:
                for row in rows_from(path, idxs, retired_idx, alias_idx):
                    cp.write_row(row)
                    n += 1
        print(f"  {table:11} {n:>10,} rows  ({time.time() - t0:.0f}s)")


def flatten(cur) -> None:
    print("Flattening -> gnaf_address ...")
    cur.execute("DROP TABLE IF EXISTS gnaf_address;")
    cur.execute(
        """
        CREATE TABLE gnaf_address AS
        SELECT a.address_detail_pid,
               nullif(a.number_first, '')::int   AS number_first,
               upper(s.street_name)              AS street_name,
               upper(s.street_type)              AS street_type,
               upper(l.locality_name)            AS locality_name,
               a.postcode                        AS postcode,
               g.latitude::numeric(9,6)          AS latitude,
               g.longitude::numeric(9,6)         AS longitude
        FROM gnaf_addr a
        JOIN gnaf_geo  g USING (address_detail_pid)
        LEFT JOIN gnaf_street s ON s.street_locality_pid = a.street_locality_pid
        LEFT JOIN gnaf_loc    l ON l.locality_pid        = a.locality_pid;
        """
    )
    # Match indexes: primary (postcode+street+number) and a looser (postcode+number) fallback.
    cur.execute("CREATE INDEX idx_gnaf_pc_street_num ON gnaf_address (postcode, street_name, number_first);")
    cur.execute("CREATE INDEX idx_gnaf_pc_loc_street ON gnaf_address (postcode, locality_name, street_name, number_first);")
    cur.execute("SELECT count(*) FROM gnaf_address;")
    print(f"  gnaf_address: {cur.fetchone()[0]:,} rows")
    # Staging no longer needed.
    for t in ("gnaf_addr", "gnaf_geo", "gnaf_street", "gnaf_loc"):
        cur.execute(f"DROP TABLE IF EXISTS {t} CASCADE;")


def main() -> None:
    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set (ingest/.env).")
    if not PSV_DIR.exists():
        sys.exit(f"{PSV_DIR} not found — extract the G-NAF Standard PSVs there first.")
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            print("Loading G-NAF staging tables ...")
            load_staging(cur)
            flatten(cur)
        conn.commit()
    print("Done.")


if __name__ == "__main__":
    main()
