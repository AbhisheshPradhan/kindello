# Deployment runbook — Kindello PoC (Vercel + Neon)

Target for the proof-of-concept demo: **Vercel** (Next.js host) + **Neon** (cloud Postgres
with PostGIS). This is the cloud step parked in `local-poc-then-cloud-for-demos` — local
stays the dev/build environment; Neon + Vercel exist only to share a live demo URL.

Vercel is enough for the PoC. The app is Next.js 16 (native Vercel case), the chat route
runs on `runtime="nodejs"` (Vercel honours it; `pg` needs Node), and `mapbox-gl` is
lazy-loaded `ssr:false` so it never breaks SSR. The only real work is moving the database
off the laptop and setting env vars.

---

## 1. Provision Neon (needs your account)

1. Create a Neon project (region: pick AU/Sydney if offered — data + users are AU).
2. Enable PostGIS in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Grab **two** connection strings from the dashboard:
   - **Pooled** (`...-pooler...`) — use this as Vercel `DATABASE_URL` (PgBouncer; survives
     serverless connection churn).
   - **Direct** (non-pooler) — use this for the one-off `pg_restore` below (restore needs a
     direct, non-pooled connection).

## 2. Migrate the data (dump/restore — keeps the 92.7% geocoding)

From the repo root, with local Postgres 18 running:

```bash
export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"

# Dump the local spine + enrichment + chat-logging tables (custom format).
pg_dump -d kindello -Fc --no-owner --no-privileges -f backups/kindello_deploy.dump

# Restore into Neon over the DIRECT (non-pooler) connection string.
pg_restore --no-owner --no-privileges -d "<NEON_DIRECT_URL>" backups/kindello_deploy.dump
```

Notes / gotchas:
- `services.geog` is a **GENERATED** column — it rebuilds from lat/lng on insert, so the
  geocoding transfers without re-running G-NAF. If `pg_restore` complains about the geog
  column, restore with `--exclude-table-data` is **not** needed; instead the safe fallback
  is the pipeline route below.
- The dump includes `chat_sessions` / `chat_messages` (app-owned logging) since they live in
  the same DB. Good — the demo logs conversations to Neon too.
- Run PostGIS `CREATE EXTENSION` (step 1.2) **before** restoring, or geog DDL fails.

### Fallback: rebuild on Neon from source (cleaner provenance, slower)

Only if dump/restore fights the generated column / PostGIS DDL:

```bash
psql "<NEON_DIRECT_URL>" -f ingest/schema.sql
DATABASE_URL="<NEON_DIRECT_URL>" python ingest/load.py     # reloads from data/raw CSVs
psql "<NEON_DIRECT_URL>" -f ingest/gis.sql                  # geog column + GiST index
psql "<NEON_DIRECT_URL>" -f web/db/schema.sql               # chat-logging tables
```
Re-geocoding (`geocode_gnaf.py`) is only needed on this path AND only if the dump's lat/lng
weren't carried — the CSV reload starts ungeocoded, so prefer dump/restore to keep coords.

## 3. Verify the build against Neon (before deploying)

`/centre/[id]` and `/search` call the DB inside `generateMetadata`/render. There's no
`generateStaticParams`, so pages render on-demand (no 18k-page build), but the build still
imports the DB module. Sanity-check locally pointed at cloud:

```bash
cd web
DATABASE_URL="<NEON_POOLED_URL>" npm run build
```
Should complete clean (it already does locally). `lib/db.ts` auto-enables SSL + a max:1 pool
for any non-localhost host, so no code change is needed between local and cloud.

## 4. Deploy to Vercel (needs your account)

1. Import the repo into Vercel. **Set the project root to `web/`** (the Next app is not at
   repo root).
2. Framework preset: Next.js. Build/install commands: defaults.
3. Set Environment Variables (Production **and** Preview):

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** (`-pooler`) connection string |
   | `ANTHROPIC_API_KEY` | Claude key (`claude-opus-4-8`) |
   | `OPENAI_API_KEY` | GPT key (keeping multi-provider dropdown) |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini key (NOT `GEMINI_API_KEY`) |
   | `NEXT_PUBLIC_MAPBOX_TOKEN` | real `pk.` token — **inlined at build**, set before deploy |

4. Deploy. Then smoke-test on the deploy URL:
   - Home renders (marketing + real ACECQA data).
   - A chat query ("childcare in Glebe NSW") resolves location + returns cards.
   - Map renders (Mapbox token live).
   - A `/centre/[id]` page loads.
   - `chat_messages` in Neon gets a new row (logging path works).

## 5. Explicitly out of scope for the PoC

Per CLAUDE.md PoC rules — **do not** set up sitemaps, `robots.txt`, canonicals, JSON-LD, or
indexation. Revisit technical SEO only at production. A custom domain (`kindello.com.au`) is
optional for the demo; Vercel's preview URL is fine to share.

## Cost shape (PoC)

- **Vercel** — free/hobby tier covers a demo.
- **Neon** — free tier covers ~18k rows + chat logs comfortably.
- **Mapbox** — free tier (50k map loads/mo).
- **LLM keys** — usage-based; the only variable cost. Watch the multi-provider dropdown if
  the demo gets shared widely.
