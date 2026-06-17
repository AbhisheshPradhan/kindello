-- PostGIS setup for Kindello (run once after the DB is on Postgres 18 w/ PostGIS).
-- Adds a spatial `geog` point to services, derived from the geocoded lat/lng, plus
-- the GiST index that powers fast "centres near me" radius search.
--
-- Apply:  psql -d kindello -f ingest/gis.sql   (idempotent)

CREATE EXTENSION IF NOT EXISTS postgis;

-- geog is a GENERATED column: Postgres recomputes it automatically whenever
-- latitude/longitude change (e.g. after a geocoding re-run), so it never drifts.
-- ST_MakePoint takes (x=longitude, y=latitude) — order matters.
ALTER TABLE services ADD COLUMN IF NOT EXISTS geog geography(Point, 4326)
    GENERATED ALWAYS AS (
        CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
             THEN ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography
        END
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_services_geog ON services USING GIST (geog);
