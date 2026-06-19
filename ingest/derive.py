"""Stage 1 enrichment — derivables (free, no external calls).

Computes fields we can produce from data we already own and upserts them into
services_meta + providers_meta (see enrichment_schema.sql):

  services_meta:
    * slug              — /childcare/{code}/{slug}; name-suburb-postcode
    * google_maps_link  — name+address search link; covers the ungeocoded tail
    * age_min/max_years — inferred from the service-type flags
  providers_meta:
    * slug              — /brands/{code}/{slug}; brand name

The base36 form of the spine's internal `id` is the URL {code} and carries
uniqueness, so slugs are cosmetic (and 301-able) — no id tail needed.

Re-running is safe: it overwrites only the Stage-1 columns and leaves every other
enrichment column (Places/ABR/operator/claim) untouched.

Usage:
  python derive.py                # apply enrichment_schema.sql then derive all
  python derive.py --no-schema    # skip schema apply
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlencode

import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SCHEMA_SQL = Path(__file__).resolve().parent / "enrichment_schema.sql"


# --- age range from service-type flags --------------------------------------
# Each applicable flag contributes a (min, max) band in years; we take the
# widest span across all flags a service carries (LDC+preschool is common).
AGE_BANDS = {
    "is_long_day_care":            (0.0, 5.0),   # 6 weeks–school age
    "is_preschool_part_of_school": (3.0, 5.0),
    "is_preschool_stand_alone":    (3.0, 5.0),
    "is_oshc_after_school":        (5.0, 12.0),
    "is_oshc_before_school":       (5.0, 12.0),
    "is_oshc_vacation_care":       (5.0, 12.0),
}


def age_range(row: dict) -> tuple[float | None, float | None]:
    bands = [b for flag, b in AGE_BANDS.items() if row.get(flag)]
    if not bands and row.get("service_type") == "Family Day Care":
        bands = [(0.0, 12.0)]   # FDC spans the lot; no finer signal in the spine
    if not bands:
        return (None, None)
    return (min(b[0] for b in bands), max(b[1] for b in bands))


# --- slug --------------------------------------------------------------------

def slugify(*parts: str | None) -> str:
    text = " ".join(p for p in parts if p)
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_-]+", "-", text).strip("-")


# --- maps link ---------------------------------------------------------------

def maps_link(row: dict) -> str:
    q = " ".join(p for p in (
        row.get("service_name"), row.get("service_address"),
        row.get("suburb"), row.get("state"), row.get("postcode"),
    ) if p)
    return "https://www.google.com/maps/search/?" + urlencode({"api": 1, "query": q})


SERVICE_UPSERT = """
INSERT INTO services_meta
    (service_approval_number, slug, google_maps_link, age_min_years, age_max_years, derived_at)
VALUES (%s, %s, %s, %s, %s, now())
ON CONFLICT (service_approval_number) DO UPDATE SET
    slug             = EXCLUDED.slug,
    google_maps_link = EXCLUDED.google_maps_link,
    age_min_years    = EXCLUDED.age_min_years,
    age_max_years    = EXCLUDED.age_max_years,
    derived_at       = now();
"""

PROVIDER_UPSERT = """
INSERT INTO providers_meta (provider_approval_number, slug)
VALUES (%s, %s)
ON CONFLICT (provider_approval_number) DO UPDATE SET slug = EXCLUDED.slug;
"""

SERVICE_COLS = (
    "service_approval_number, service_name, service_address, suburb, state, postcode, "
    "service_type, is_long_day_care, is_preschool_part_of_school, is_preschool_stand_alone, "
    "is_oshc_after_school, is_oshc_before_school, is_oshc_vacation_care"
)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-schema", action="store_true", help="skip applying enrichment_schema.sql")
    args = ap.parse_args()

    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set (ingest/.env).")

    with psycopg.connect(DATABASE_URL, row_factory=psycopg.rows.dict_row) as conn:
        with conn.cursor() as cur:
            if not args.no_schema:
                print("Applying enrichment_schema.sql ...")
                cur.execute(SCHEMA_SQL.read_text())

            cur.execute(f"SELECT {SERVICE_COLS} FROM services")
            services = cur.fetchall()
            cur.execute(
                "SELECT provider_approval_number, trading_name, legal_name FROM providers"
            )
            providers = cur.fetchall()

        service_vals = []
        for r in services:
            amin, amax = age_range(r)
            slug = slugify(r.get("service_name"), r.get("suburb"), r.get("postcode"))
            service_vals.append(
                (r["service_approval_number"], slug, maps_link(r), amin, amax)
            )

        provider_vals = [
            (r["provider_approval_number"],
             slugify(r.get("trading_name") or r.get("legal_name")))
            for r in providers
        ]

        with conn.cursor() as cur:
            cur.executemany(SERVICE_UPSERT, service_vals)
            cur.executemany(PROVIDER_UPSERT, provider_vals)
        conn.commit()

    n_age = sum(1 for v in service_vals if v[3] is not None)
    print(f"Derived {len(service_vals):,} services ({n_age:,} with an age range) "
          f"+ {len(provider_vals):,} providers.")


if __name__ == "__main__":
    main()
