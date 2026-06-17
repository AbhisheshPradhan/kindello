# Kindello

A database of every approved childcare / early-childhood-education service in Australia, plus an AI finder that helps parents find the right fit. We license the cleaned, daily-synced data — as a feed, an embeddable chatbot widget, and an API — to childcare directories.

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
   │  NODE.js / TypeScript  (web/ — Next.js)                        │
   │  the APPLICATION backend + frontend, one codebase:             │
   │   • API routes (/api/chat) = the backend                       │
   │   • Vercel AI SDK (model calls + tools, multi-provider)        │
   │   • the chat UI + (later) embeddable widget                    │
   └────────────────────────────────────────────────────────────────┘
```

- **Data spine** — ACECQA National Registers: every approved provider + service + NQS quality rating (18,229 services, updated daily by the regulator).
- **Enrichment** — geocoding (done, via G-NAF); later: fees/vacancies, Google reviews/photos, philosophy/programs, ABN, vector embeddings.
- **DB** — PostgreSQL 18 local (→ Neon in cloud, for demos/production). **PostGIS** enabled for radius search; **pgvector** to be added for chatbot embeddings.
- **Ingest** — Python (`ingest/`): download → geocode → load.
- **Web app + chatbot + B2B API** — TypeScript / Next.js (`web/`), Vercel AI SDK for provider-agnostic model calls + tool calling. UI built on **prompt-kit** (shadcn/ui + Tailwind v4) with light/dark mode.

## Status

- ✅ Spine loaded: 18,229 services + 10,737 providers
- ✅ Geocoded 92.7% via G-NAF (free, authoritative, redistributable AU open data)
- ✅ PostGIS radius search ("centres near me")
- 🚧 Chatbot: Next.js + Vercel AI SDK, search tools over Postgres, model-switch dropdown; prompt-kit chat UI (dark mode, animated placeholder, centered fresh-session composer)
- ⬜ Enrichment (Places, fees, vacancies), pgvector, embeddable widget, B2B API

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

# Web app (chatbot + UI)
cd ../web
npm install
cp .env.example .env.local         # fill DATABASE_URL + provider API keys
npm run dev                          # http://localhost:3000
```

Database `kindello` is already created locally.
