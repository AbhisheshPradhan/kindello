-- Kindello schema — Tier 2 "enrichment" (the moat).
-- Lives in SEPARATE 1:1 meta tables (services_meta, providers_meta) keyed on the
-- spine's approval numbers, deliberately kept out of the daily-sync blast radius
-- (load.py never touches them). Every third-party field carries its own
-- *_fetched_at / source provenance so sources refresh on independent cadences and
-- the feed we sell has a clean licensing story (spine = open ACECQA; enrichment
-- = our IP).
--
-- Also adds the internal surrogate `id` to the spine tables: a stable,
-- regulator-agnostic handle whose base36 form is the public URL {code}
-- (/childcare/{code}/{slug}, /brands/{code}/{slug}). It is GENERATED ALWAYS AS
-- IDENTITY and never appears in load.py's upsert column lists, so the daily sync
-- never disturbs it. approval numbers stay the data join keys.
--
-- Apply with:  psql -d kindello -f ingest/enrichment_schema.sql   (idempotent)

-- ---------------------------------------------------------------------------
-- Internal ids on the spine (URL {code} = base36(id)).
-- ---------------------------------------------------------------------------
ALTER TABLE services  ADD COLUMN IF NOT EXISTS id bigint GENERATED ALWAYS AS IDENTITY;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS id bigint GENERATED ALWAYS AS IDENTITY;
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_id  ON services  (id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_id ON providers (id);

-- ---------------------------------------------------------------------------
-- providers_meta  (brand-level enrichment — fetched once per provider/domain,
--   inherited DOWN to that provider's services where applicable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers_meta (
    provider_approval_number  text PRIMARY KEY
        REFERENCES providers (provider_approval_number) ON DELETE CASCADE,

    -- Stage 1: derivable
    slug          text,                    -- /brands/{code}/{slug}; brand name

    -- Stage 1b: provider aggregates (computed from the spine — powers brand pages)
    centre_count          integer,         -- # services under this provider
    states                jsonb,           -- ["NSW","VIC"] distinct, ordered by count
    total_approved_places integer,         -- sum across services
    care_types            jsonb,           -- ["Centre-Based Care","Family Day Care"]
    nqs_summary           jsonb,           -- {"Exceeding NQS":3,"Meeting NQS":2,...}
    aggregates_at         timestamptz,

    -- Stage 3: ABR (free) — ABN is a property of the legal entity, not a centre
    abn            text,
    abn_fetched_at timestamptz,

    -- Stage 4: operator-site crawl (once per domain) — brand identity + pedagogy
    website        text,
    logo_url       text,
    description    text,
    philosophy     text,                   -- Montessori / Reggio / Play-based ...
    programs       jsonb,                  -- brand-wide programs
    crawl_source_url text,
    crawled_at     timestamptz,

    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- services_meta  (location-level enrichment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services_meta (
    service_approval_number  text PRIMARY KEY
        REFERENCES services (service_approval_number) ON DELETE CASCADE,

    -- Stage 1: derivables (free, computed from data we already own)
    slug              text,                 -- /childcare/{code}/{slug}; name-suburb-postcode
    google_maps_link  text,                 -- name+address fallback (covers ungeocoded tail)
    age_min_years     numeric(3,1),         -- inferred from service-type flags
    age_max_years     numeric(3,1),
    derived_at        timestamptz,

    -- Stage 2: discovery + crawl (keyless — Bing search via Puppeteer/Webshare).
    website           text,                 -- centre's own site (search-discovered)
    website_source    text,                 -- 'search-bing' | 'provider' | 'manual'
    website_verified  boolean,              -- page actually mentions the centre name/suburb
    email             text,                 -- scraped from the site (regex)
    discovered_at     timestamptz,

    -- google_place_id is the ONE Google field we may store (live garnish only); the
    -- rest of Google (rating/reviews/photos) stays render-time, never persisted.
    google_place_id      text,

    -- Stage 4: centre-specific extraction (inclusions/languages are per-location;
    --   philosophy/programs live on providers_meta and are inherited)
    inclusions        jsonb,                -- ["Meals", "Nappies", "Sunscreen", ...]
    languages         jsonb,
    operator_fetched_at timestamptz,

    -- Stage 5: claim portal (licensed, centre-supplied) — the wedge
    fees           jsonb,                   -- {daily_rate, ccs_eligible, ...}
    vacancies      jsonb,                   -- {"0-2": true, "2-3": false, ...}
    photos         jsonb,                   -- [{url, caption}] — uploaded, ours to serve
    claimed        boolean NOT NULL DEFAULT false,
    claimed_at     timestamptz,

    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- slug is cosmetic / 301-able; the base36 {code} carries uniqueness, so these are
-- plain (non-unique) lookup indexes, not constraints.
CREATE INDEX IF NOT EXISTS idx_services_meta_slug  ON services_meta  (slug);
CREATE INDEX IF NOT EXISTS idx_providers_meta_slug ON providers_meta (slug);
CREATE INDEX IF NOT EXISTS idx_services_meta_claimed ON services_meta (claimed) WHERE claimed;
