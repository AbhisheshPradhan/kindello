"""Kindello search core — the two functions the chatbot will call as tools.

  resolve_location(text) -> a coordinate to anchor a search on. Uses OUR OWN data
      (centroid of geocoded centres in a postcode / suburb) so no geocoding API is
      needed for the common "near <suburb/postcode>" case.

  search_centres(lat, lng, ...) -> nearest childcare centres within a radius, with
      care-type / rating filters, sorted by distance. Backed by the PostGIS GiST
      index (ST_DWithin prune + <-> KNN sort).

Both return plain dicts/lists so they map straight onto Claude tool-calling later,
and can be ported to the Next.js API. CLI included for PoC persona testing.

Usage:
  python search.py "Bondi" --care long_day_care --radius 5
  python search.py 2150 --care oshc --min-rating exceeding --radius 8
  python search.py -33.89 151.27 --care long_day_care        # explicit lat lng
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from urllib.parse import quote_plus

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")

# NQS ratings worst -> best, so we can express "at least <rating>".
RATING_ORDER = [
    "Significant Improvement Required", "Working Towards NQS",
    "Meeting NQS", "Exceeding NQS", "Excellent",
]

# care_type -> SQL predicate over the service flags / type.
CARE_PREDICATES = {
    "long_day_care": "is_long_day_care",
    "preschool": "(is_preschool_stand_alone OR is_preschool_part_of_school)",
    "oshc": "(is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care)",
    "family_day_care": "service_type = 'Family Day Care'",
}


def _connect():
    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set (ingest/.env).")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def resolve_location(text: str, conn=None) -> dict | None:
    """Turn 'Bondi' / '2026' / 'Bondi NSW' into a coordinate, using our own centres.

    Returns {lat, lng, label, kind, n} or None if we have no centres there to anchor on.
    """
    text = (text or "").strip()
    if not text:
        return None
    own = conn or _connect()
    try:
        # Pure 4-digit -> postcode centroid.
        if re.fullmatch(r"\d{4}", text):
            row = own.execute(
                "SELECT avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*) n "
                "FROM services WHERE postcode = %s AND latitude IS NOT NULL", (text,)
            ).fetchone()
            if row and row["n"]:
                return {"lat": row["lat"], "lng": row["lng"], "label": f"postcode {text}",
                        "kind": "postcode", "n": row["n"]}
            return None

        # "suburb" or "suburb STATE" -> suburb centroid (optionally state-filtered).
        m = re.match(r"^(.*?)(?:\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA))?$", text, re.I)
        suburb = m.group(1).strip()
        state = (m.group(2) or "").upper()
        sql = ("SELECT avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*) n "
               "FROM services WHERE upper(suburb) = upper(%s) AND latitude IS NOT NULL")
        params: list = [suburb]
        if state:
            sql += " AND state = %s"
            params.append(state)
        row = own.execute(sql, params).fetchone()
        if row and row["n"]:
            label = f"{suburb.title()}" + (f", {state}" if state else "")
            return {"lat": row["lat"], "lng": row["lng"], "label": label,
                    "kind": "suburb", "n": row["n"]}
        return None
    finally:
        if conn is None:
            own.close()


def _maps_link(name: str, address: str | None, suburb: str, state: str, postcode: str) -> str:
    q = ", ".join(p for p in [name, address, suburb, state, postcode] if p)
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(q)}"


def search_centres(lat: float, lng: float, radius_km: float = 5,
                   care_type: str | None = None, min_rating: str | None = None,
                   limit: int = 10, conn=None) -> list[dict]:
    """Nearest centres within radius_km, filtered, sorted by distance.

    care_type: one of long_day_care | preschool | oshc | family_day_care
    min_rating: an NQS rating; only centres rated at least that good are returned.
    """
    own = conn or _connect()
    try:
        where = ["geog IS NOT NULL", "ST_DWithin(geog, ST_MakePoint(%(lng)s,%(lat)s)::geography, %(r)s)"]
        params: dict = {"lat": lat, "lng": lng, "r": radius_km * 1000, "lim": limit}

        if care_type:
            if care_type not in CARE_PREDICATES:
                raise ValueError(f"care_type must be one of {list(CARE_PREDICATES)}")
            where.append(CARE_PREDICATES[care_type])

        if min_rating:
            if min_rating not in RATING_ORDER:
                raise ValueError(f"min_rating must be one of {RATING_ORDER}")
            allowed = RATING_ORDER[RATING_ORDER.index(min_rating):]
            where.append("overall_rating = ANY(%(ratings)s)")
            params["ratings"] = allowed

        rows = own.execute(
            f"""
            SELECT service_name, service_address, suburb, state, postcode,
                   overall_rating, number_of_approved_places, phone,
                   latitude::float8 AS lat, longitude::float8 AS lng,
                   round((ST_Distance(geog, ST_MakePoint(%(lng)s,%(lat)s)::geography)/1000)::numeric, 2)::float8 AS distance_km
            FROM services
            WHERE {' AND '.join(where)}
            ORDER BY geog <-> ST_MakePoint(%(lng)s,%(lat)s)::geography
            LIMIT %(lim)s
            """, params,
        ).fetchall()

        for r in rows:
            r["maps_link"] = _maps_link(r["service_name"], r["service_address"],
                                        r["suburb"], r["state"], r["postcode"])
        return rows
    finally:
        if conn is None:
            own.close()


def _cli() -> None:
    ap = argparse.ArgumentParser(description="Kindello centre search (PoC)")
    ap.add_argument("location", nargs="+", help='a suburb/postcode ("Bondi", "2026") OR two numbers: lat lng')
    ap.add_argument("--care", choices=list(CARE_PREDICATES), help="care type filter")
    ap.add_argument("--min-rating", choices=RATING_ORDER, help="minimum NQS rating")
    ap.add_argument("--radius", type=float, default=5, help="radius in km (default 5)")
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--json", action="store_true", help="emit JSON")
    args = ap.parse_args()

    with _connect() as conn:
        # Two numeric args = explicit lat lng; otherwise treat as a place name.
        if len(args.location) == 2 and all(re.fullmatch(r"-?\d+(\.\d+)?", x) for x in args.location):
            lat, lng, label = float(args.location[0]), float(args.location[1]), "given point"
        else:
            loc = resolve_location(" ".join(args.location), conn=conn)
            if not loc:
                sys.exit(f"Could not resolve a location from {' '.join(args.location)!r} "
                         f"(no geocoded centres there to anchor on).")
            lat, lng, label = loc["lat"], loc["lng"], f'{loc["label"]} ({loc["n"]} centres)'

        results = search_centres(lat, lng, args.radius, args.care, args.min_rating, args.limit, conn=conn)

        if args.json:
            print(json.dumps(results, indent=2))
            return
        filt = " | ".join(x for x in [args.care, (f"≥{args.min_rating}" if args.min_rating else None)] if x)
        print(f"\nNear {label} — within {args.radius:g}km{(' — ' + filt) if filt else ''}\n")
        if not results:
            print("  (no matches — try a wider radius or fewer filters)")
            return
        for i, r in enumerate(results, 1):
            print(f"{i:2}. {r['distance_km']:>5}km  {r['service_name']}")
            print(f"      {r['suburb']} {r['postcode']} · {r['overall_rating'] or 'not rated'} · {r['number_of_approved_places'] or '?'} places")


if __name__ == "__main__":
    _cli()
