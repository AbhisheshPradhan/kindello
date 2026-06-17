-- Kindello — exploration / sanity queries for the ACECQA spine.
-- Run a single block at a time: in pgAdmin's Query Tool select the lines you
-- want and hit ▶ (F5); in psql you can run the whole file with \i explore.sql.

-- =========================================================================
-- 0. What's in here
-- =========================================================================
SELECT
  (SELECT count(*) FROM services)  AS services,
  (SELECT count(*) FROM providers) AS providers;

-- Peek at a few service rows (wide table — pick the columns that matter)
SELECT service_approval_number, service_name, service_type, suburb, state,
       postcode, number_of_approved_places, overall_rating, temporarily_closed
FROM services
LIMIT 25;


-- =========================================================================
-- 1. Coverage / distribution
-- =========================================================================
-- Services per state
SELECT coalesce(nullif(state,''),'(blank)') AS state, count(*)
FROM services GROUP BY 1 ORDER BY 2 DESC;

-- Overall NQS rating distribution
SELECT coalesce(nullif(overall_rating,''),'(not rated)') AS overall_rating, count(*)
FROM services GROUP BY 1 ORDER BY 2 DESC;

-- Care-type breakdown (a service can have several flags)
SELECT
  count(*) FILTER (WHERE is_long_day_care)            AS long_day_care,
  count(*) FILTER (WHERE is_preschool_stand_alone)    AS preschool_standalone,
  count(*) FILTER (WHERE is_preschool_part_of_school) AS preschool_in_school,
  count(*) FILTER (WHERE is_oshc_before_school)       AS oshc_before,
  count(*) FILTER (WHERE is_oshc_after_school)        AS oshc_after,
  count(*) FILTER (WHERE is_oshc_vacation_care)       AS oshc_vacation,
  count(*) FILTER (WHERE is_other_type)               AS other
FROM services;


-- =========================================================================
-- 2. Parent-style searches (what the chatbot will do)
-- =========================================================================
-- Long day care in a postcode, best-rated first
SELECT service_name, suburb, overall_rating, number_of_approved_places, phone
FROM services
WHERE postcode = '2000' AND is_long_day_care
ORDER BY array_position(
           ARRAY['Excellent','Exceeding NQS','Meeting NQS','Working Towards NQS',
                 'Significant Improvement Required'], overall_rating);

-- Before/after school care (OSHC) in a suburb
SELECT service_name, suburb, postcode, overall_rating
FROM services
WHERE state = 'NSW' AND suburb ILIKE 'the rocks'
  AND (is_oshc_before_school OR is_oshc_after_school)
ORDER BY service_name;

-- Free-text name search
SELECT service_name, suburb, state, service_type
FROM services
WHERE service_name ILIKE '%montessori%'
ORDER BY state, suburb
LIMIT 50;


-- =========================================================================
-- 3. Joins, hours, and the data-quality view
-- =========================================================================
-- Service joined to its provider
SELECT s.service_name, s.suburb, s.overall_rating,
       p.legal_name AS provider, p.trading_name
FROM services s
JOIN providers p USING (provider_approval_number)
WHERE s.postcode = '2000'
LIMIT 25;

-- Operating hours (JSONB) for one service, pretty-printed
SELECT service_name, jsonb_pretty(operating_hours)
FROM services
WHERE operating_hours IS NOT NULL
LIMIT 1;

-- Providers running the most services
SELECT p.legal_name, count(*) AS num_services
FROM services s JOIN providers p USING (provider_approval_number)
GROUP BY p.legal_name ORDER BY num_services DESC LIMIT 20;

-- Temporarily closed services
SELECT service_name, suburb, state FROM services WHERE temporarily_closed;

-- Enrichment gap: how many still need geocoding (lat/lng) — currently all of them
SELECT count(*) FILTER (WHERE latitude IS NULL) AS needs_geocode,
       count(*) FILTER (WHERE latitude IS NOT NULL) AS geocoded
FROM services;


-- =========================================================================
-- 4. PostGIS "near me" search  (requires ingest/gis.sql applied)
--    Pattern: ST_DWithin(...) prunes via the spatial index, then we sort by
--    distance with the <-> KNN operator. Swap in the parent's lat/lng + filters.
-- =========================================================================
-- Toddler parent: Long Day Care within 5km of a point, nearest first
SELECT service_name, suburb, overall_rating,
       round((ST_Distance(geog, ST_MakePoint(:lng, :lat)::geography)/1000)::numeric, 2) AS km
FROM services
WHERE is_long_day_care
  AND ST_DWithin(geog, ST_MakePoint(:lng, :lat)::geography, 5000)
ORDER BY geog <-> ST_MakePoint(:lng, :lat)::geography
LIMIT 10;
-- (run with e.g.  psql -d kindello -v lat=-33.89 -v lng=151.27 -f ingest/explore.sql)

-- School-age parent: before/after-school care (OSHC) within 8km, nearest first
SELECT service_name, suburb, overall_rating,
       round((ST_Distance(geog, ST_MakePoint(:lng, :lat)::geography)/1000)::numeric, 2) AS km
FROM services
WHERE (is_oshc_before_school OR is_oshc_after_school)
  AND ST_DWithin(geog, ST_MakePoint(:lng, :lat)::geography, 8000)
ORDER BY geog <-> ST_MakePoint(:lng, :lat)::geography
LIMIT 10;

-- Quality-first parent: only Exceeding/Excellent, willing to travel 15km
SELECT service_name, suburb, overall_rating,
       round((ST_Distance(geog, ST_MakePoint(:lng, :lat)::geography)/1000)::numeric, 2) AS km
FROM services
WHERE overall_rating IN ('Exceeding NQS','Excellent')
  AND ST_DWithin(geog, ST_MakePoint(:lng, :lat)::geography, 15000)
ORDER BY geog <-> ST_MakePoint(:lng, :lat)::geography
LIMIT 10;
