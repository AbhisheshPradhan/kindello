-- Kindello schema — Tier 2 "enrichment" (the moat).
-- Lives in a SEPARATE 1:1 table keyed on service_approval_number, deliberately
-- kept out of the spine's daily-sync blast radius (load.py never touches this).
-- Every third-party field carries its own *_fetched_at / source provenance so
-- different sources can refresh on different cadences and the feed we sell has a
-- clean licensing story (spine = open ACECQA; enrichment = our IP).
--
-- Apply with:  psql -d kindello -f ingest/enrichment_schema.sql   (idempotent)

CREATE TABLE IF NOT EXISTS services_meta (
    service_approval_number  text PRIMARY KEY
        REFERENCES services (service_approval_number) ON DELETE CASCADE,

    -- ---- Stage 1: derivables (free, computed from data we already own) ------
    slug              text,                 -- SEO URL: name-suburb-id
    google_maps_link  text,                 -- name+address fallback (covers ungeocoded tail)
    age_min_years     numeric(3,1),         -- inferred from service-type flags
    age_max_years     numeric(3,1),
    derived_at        timestamptz,

    -- ---- Stage 2: Google Places (resellable fields only; photos served live) -
    google_place_id      text,
    google_rating        numeric(2,1),
    google_review_count  integer,
    google_website       text,
    google_email         text,
    places_fetched_at    timestamptz,

    -- ---- Stage 3: ABR (free) ------------------------------------------------
    abn            text,
    abn_fetched_at timestamptz,

    -- ---- Stage 4: operator-site LLM extraction ------------------------------
    philosophy        text,                 -- Montessori / Reggio / Play-based ...
    programs          jsonb,                -- ["Kindergarten program", "School readiness", ...]
    inclusions        jsonb,                -- ["Meals", "Nappies", "Sunscreen", ...]
    languages         jsonb,
    operator_source_url text,
    operator_fetched_at timestamptz,

    -- ---- The wedge: claim portal (licensed, centre-supplied) ----------------
    fees           jsonb,                   -- {daily_rate, ccs_eligible, ...}
    vacancies      jsonb,                   -- {"0-2": true, "2-3": false, ...}
    photos         jsonb,                   -- [{url, caption}] — uploaded, ours to serve
    claimed        boolean NOT NULL DEFAULT false,
    claimed_at     timestamptz,

    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_slug ON services_meta (slug);
CREATE INDEX IF NOT EXISTS idx_meta_claimed     ON services_meta (claimed) WHERE claimed;
