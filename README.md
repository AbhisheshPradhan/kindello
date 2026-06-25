# Kindello

**DEMO:** <a href="https://kindello.vercel.app/" target="_blank" rel="noopener noreferrer">kindello.vercel.app</a>

A public **directory** of every approved childcare / early-childhood-education service in Australia (~18k centres), built on the authoritative ACECQA spine. The same cleaned, daily-synced data is the B2B asset — licensed later as a feed, an API, and an embeddable widget to other childcare directories.

> **Pivot (2026-06):** the consumer product is a **traditional, location-based directory** (suburb + care-type landing pages, list + map, centre detail pages) — the model CareforKids / KindiCare use and that parents + Google expect. The earlier **AI chat finder is parked, not deleted**: it still runs at `/finder`, but it's no longer the main flow. The chat tooling (Vercel AI SDK, tool-calling search) is preserved for later experiments and for the future embeddable widget.

## Architecture

Two backends, one shared database. **Python** does the offline data engineering; **Node/Next.js** is the live product. Postgres is the contract between them.

```
   ┌─────────────────────────┐          ┌─────────────────────────────┐
   │  PYTHON  (ingest/)      │  write  │                              │
   │  ETL / data pipeline    │────────▶│        Postgres              │
   │  • download ACECQA CSVs │         │   (the shared source         │
   │  • geocode vs G-NAF     │         │    of truth — PostGIS now,   │
   │  • load + enrich        │         │    pgvector later)           │
   │  runs on a schedule     │         └──────────────────────────────┘
   └─────────────────────────┘                       ▲
                                                     │ read
   ┌─────────────────────────────────────────────────┴──────────────┐
   │  NODE.js / TypeScript  (web/ — Next.js 16)                     │
   │  the APPLICATION backend + frontend, one codebase:             │
   │   • Directory pages: /childcare/{suburb}/{postcode},           │
   │     /{careType}/{suburb}/{postcode}, /centre/{id}  (SEO)       │
   │   • /api/search + /api/directory-area = radius queries (PostGIS)│
   │   • Mapbox list+map UI, "Search this area" / "Zoom in to search"│
   │   • AI chat finder PARKED at /finder (/api/chat, Vercel AI SDK) │
   └────────────────────────────────────────────────────────────────┘
```

- **Data spine** — ACECQA National Registers: every approved provider + service + NQS quality rating (18,229 services, updated daily by the regulator).
- **Enrichment** — geocoding (done, via G-NAF) + a keyless operator-site crawl (done: websites/logos/photos/emails into `services_meta`); later: fees/vacancies, Google reviews/photos, philosophy/programs, ABN, vector embeddings.
- **DB** — PostgreSQL 18 local (→ Neon in cloud, for demos/production). **PostGIS** enabled for radius search; **pgvector** to be added later for the parked chatbot embeddings.
- **Ingest** — Python (`ingest/`): download → geocode → load.
- **Web app** — TypeScript / Next.js 16 (`web/`): server-rendered directory pages + Mapbox map, on the design system in `web/components/ds/`. The parked AI finder reuses `/api/chat` + the Vercel AI SDK.

## Status

- ✅ Spine loaded: 18,229 services + 10,737 providers
- ✅ Geocoded 92.7% via G-NAF (free, authoritative, redistributable AU open data)
- ✅ PostGIS radius search ("centres near me")
- ✅ **Operator-site crawl** (keyless Puppeteer + residential proxies): 18,227 websites, 17,038 logos (93%), 13,418 photos (74%), 10,925 emails (60%) into `services_meta`
- ✅ **Directory frontend**: homepage (location search hero + browse), suburb + care-type landing pages (radius-based list + Mapbox map, "Search this area" / "Zoom in to search" → "Map Area"), centre detail pages with NQS quality areas
- 🅿️ AI chat finder parked at `/finder` (Next.js + Vercel AI SDK, tool-calling search over Postgres)
- ⬜ Enrichment (Places, fees, vacancies, ABN), pgvector, technical SEO polish (sitemaps/JSON-LD), embeddable widget, B2B feed/API

## Data sourcing note

The official sources WAF-block datacenter/proxy IPs, but a plain `curl` from a residential IP returns 200 — so the two national CSVs (services + providers) download directly. Geocoding uses **G-NAF** (Geoscape open data on data.gov.au). Automated production refresh = residential-IP box or an official ACECQA data agreement. See `CLAUDE.md` for the full sourcing detail.

## Local setup

```bash
# Postgres 18 (with PostGIS) via Homebrew
brew services start postgresql@18
export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"

# Python data pipeline
cd ingest
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill DATABASE_URL
# rebuild: psql -d kindello -f schema.sql → python load.py → python geocode_gnaf.py → psql -d kindello -f gis.sql

# Web app (directory + parked chat)
cd ../web
npm install
cp .env.example .env.local         # fill DATABASE_URL + NEXT_PUBLIC_MAPBOX_TOKEN (+ provider keys for /finder)
npm run dev                          # http://localhost:3000
```

Database `kindello` is already created locally.
