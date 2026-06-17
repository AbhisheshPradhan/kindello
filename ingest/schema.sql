-- Kindello schema — Tier 1 "spine" (authoritative ACECQA National Registers data).
-- Columns derived from the real national CSV exports (see CLAUDE.md "Data sourcing").
-- Source-of-truth fields are overwritten on each daily sync; enrichment columns
-- (lat/lng, etc.) are write-once-cached and live alongside but are never touched
-- by the spine loader.
--
-- Apply with:  psql -d kindello -f ingest/schema.sql   (idempotent)

-- ---------------------------------------------------------------------------
-- providers  (Approved-providers-au-export.csv — 10 columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
    provider_approval_number  text PRIMARY KEY,          -- e.g. PR-00006359
    service_approval_number   text,                      -- present in export; usually blank
    legal_name                text,
    trading_name              text,
    address                   text,
    suburb                    text,
    state                     text,
    postcode                  text,
    date_approval_granted     date,                      -- DD/MM/YYYY in source
    conditions                text,
    last_synced_at            timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- services  (Education-services-au-export.csv — 98 columns)
--   * core/typed columns we filter and query on
--   * the 56 session/operating-time columns collapse into operating_hours JSONB
--   * enrichment columns (latitude/longitude/...) are placeholders, filled later
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    service_approval_number          text PRIMARY KEY,    -- e.g. SE-00009695
    provider_approval_number         text REFERENCES providers (provider_approval_number),
    service_name                     text,
    provider_legal_name              text,
    service_type                     text,                -- Centre-Based Care / Family Day Care / ...
    service_address                  text,
    suburb                           text,
    state                            text,
    postcode                         text,
    phone                            text,
    fax                              text,
    conditions_on_approval           text,
    number_of_approved_places        integer,
    service_approval_granted_date    date,                -- DD/MM/YYYY

    -- Current NQS quality ratings
    quality_area_1_rating            text,
    quality_area_2_rating            text,
    quality_area_3_rating            text,
    quality_area_4_rating            text,
    quality_area_5_rating            text,
    quality_area_6_rating            text,
    quality_area_7_rating            text,
    overall_rating                   text,                -- Meeting NQS / Exceeding NQS / ...
    ratings_issued                   text,                -- "Mon YYYY" (not a precise date)

    -- Previous NQS quality ratings
    previous_quality_area_1_rating   text,
    previous_quality_area_2_rating   text,
    previous_quality_area_3_rating   text,
    previous_quality_area_4_rating   text,
    previous_quality_area_5_rating   text,
    previous_quality_area_6_rating   text,
    previous_quality_area_7_rating   text,
    previous_overall_rating          text,
    previous_ratings_issued          text,                -- "Mon YYYY"

    last_service_approval_transfer_date  date,            -- DD/MM/YYYY (often blank)
    last_visit_date                  text,                -- "Month YYYY" (not a precise date)

    -- Service-type flags (Yes/No in source)
    is_long_day_care                 boolean,
    is_preschool_part_of_school      boolean,
    is_preschool_stand_alone         boolean,
    is_oshc_after_school             boolean,
    is_oshc_before_school            boolean,
    is_oshc_vacation_care            boolean,
    is_other_type                    boolean,

    temporarily_closed               boolean,

    -- The 56 operating-time columns, structured as:
    --   { "annual": {"monday": {"start": "...", "end": "..."}, ...},
    --     "school_terms_session_1": {...}, "school_terms_session_2": {...},
    --     "holiday_care": {...} }   (only non-empty day entries kept)
    operating_hours                  jsonb,

    -- Enrichment (Tier 2) — not populated by the spine loader.
    latitude                         numeric(9,6),
    longitude                        numeric(9,6),
    last_geocoded_at                 timestamptz,

    last_synced_at                   timestamptz NOT NULL DEFAULT now()
);

-- Indexes for the common chatbot/API filters (geo radius comes later with PostGIS).
CREATE INDEX IF NOT EXISTS idx_services_provider     ON services (provider_approval_number);
CREATE INDEX IF NOT EXISTS idx_services_state        ON services (state);
CREATE INDEX IF NOT EXISTS idx_services_postcode     ON services (postcode);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services (service_type);
CREATE INDEX IF NOT EXISTS idx_services_overall      ON services (overall_rating);
