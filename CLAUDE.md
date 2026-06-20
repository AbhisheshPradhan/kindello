# CLAUDE.md — Kindello

Guidance for Claude Code when working in this repo. Keep this file current as the project evolves.

## What we're building

**Kindello** — a database of every approved childcare / early-childhood-education service in Australia, fronted by a public **consumer directory** (location + care-type landing pages, list + map, centre detail). Monetised B2B: the cleaned, enriched, daily-synced data is sold as a **feed + API + embeddable widget** to childcare directories (and, later, a supply-side "claim your listing" channel for centres).

> **Current focus (2026-06-19): LAUNCHING A SLIM DIRECTORY ASAP.** We are no longer a proof-of-concept — the immediate goal is a public, launchable consumer directory: get as much per-service information into the DB as we can (see "Enrichment project" below), then ship it with polished UI/UX. This reprioritises real production concerns (technical SEO, canonical URLs, performance) that were previously deferred.

> **PIVOT (2026-06): AI chat search → traditional directory.** The consumer surface is now a **classic, location-based directory** (the CareforKids / KindiCare model parents and Google expect: `/childcare/{suburb}/{postcode}` + `/{careType}/...` + `/centre/{id}`, radius-based list + Mapbox map, "Search this area"/"Zoom in to search"). The **AI chat finder is PARKED, not deleted** — it still runs at `/finder` and is not linked from the main flow. The chat stack (Vercel AI SDK, `/api/chat`, tool-calling `searchCentres`/`resolveLocation`) is preserved for later experiments and the future **embeddable widget** (where conversational search is the actual B2B product). When this file or the docs describe "the chatbot" as the product, read it through this pivot: directory = the launch product; chat = a parked/secondary surface + future widget. _(See [`web/ROADMAP.md`](web/ROADMAP.md) for the directory build order and [`brainstorm.md`](brainstorm.md) for the idea backlog + research log + near-term launch tasks. The old `PoC.md` was retired into `brainstorm.md` when this pivot landed.)_

Reference competitor: **KindiCare**, **CareforKids.com.au** (AU); **Kindello Ltd** is an unrelated active NZ/UAE childcare marketplace — we chose `kindello.com.au` deliberately; register the AU trademark to secure first-use.

### Product idea (parked) — chatbot-driven inquiry + CRM-as-a-service

A directory-embedded chatbot where **parents chat to find a centre**. When a parent wants more info on a centre, instead of kicking off an email back-and-forth with the centre, the **centre uploads documents/PDFs (availability, fees, programs)** that the chatbot **ingests and serves up-to-date answers** to the parent directly. Replaces the slow email loop with instant, current answers.

The chat sessions themselves become the asset: build a **CRM for centres as a paid service** on top of them — every parent conversation is a captured lead/inquiry (what they asked, which centre, intent, contact), giving centres a pipeline + analytics they don't get today. Demand-side value for parents (fast answers) feeds supply-side monetisation (centres pay for the leads + CRM).

## Data model (two-tier)

1. **Spine (authoritative, free):** ACECQA National Registers — every approved provider + service, service type (Centre-Based Care / OSHC / Family Day Care / Preschool), address, approved places, and the **NQS quality rating** (overall + 7 quality areas). ~16,500 services, rebuilt daily by the regulator.
2. **Enrichment (the moat):** geocoding (lat/lng — spine has addresses only), fees, vacancies, hours, inclusions (StartingBlocks / operators), Google Places (reviews/photos/hours), philosophy/programs (operator sites), ABN (ABR), and a vector embedding per service for the chatbot.

Source-of-truth fields are overwritten on daily sync; enrichment fields are write-once-cached and refreshed on slower cadences. Store `last_synced_at` per record and surface freshness (it's a selling point; vacancies especially go stale).

**Empirical dataset characteristics** (rating/service-type distributions, field coverage, FDC address caveat) are recorded in [`docs/data-findings.md`](docs/data-findings.md) — read it before making product decisions that depend on how the data is actually shaped (e.g. NQS "Meeting" is 68% so it's a weak per-row signal; every Centre-Based Care row carries a specific type flag; phone is the only contact field).

## Enrichment project (`services_meta` + `providers_meta`)

Enrichment lives in **separate 1:1 meta tables** (`services_meta` keyed on `service_approval_number`, `providers_meta` keyed on `provider_approval_number`, both `ON DELETE CASCADE`), deliberately kept out of the spine's daily-sync blast radius — `ingest/load.py` never touches them. Schema: [`ingest/enrichment_schema.sql`](ingest/enrichment_schema.sql). Every third-party field carries its own `*_fetched_at` provenance so sources refresh on independent cadences and (later) the feed we sell has a clean licensing line (spine = open ACECQA; enrichment = our IP).

**Run enrichment provider-first.** Some data is inherently provider-level and is fetched **once per provider/domain, then inherited down** to that provider's services — never re-fetched per service: **ABN** (belongs to the legal entity → `providers_meta`) and the **operator-site crawl** (one brand runs one website → logo/description/philosophy/programs to `providers_meta`, deduped by domain). Only truly per-location data (Places, fees, vacancies, this-centre photos, inclusions/languages) is service-level. Reuse flows provider → service, not the reverse.

| Stage                           | Datapoints                                                                                     | Table     | Source                                                             | Status   |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------ | -------- |
| **1. Derivables**               | `slug`, `google_maps_link`, `age_min/max_years` (services); `slug` (providers)                 | both      | computed from data we own ([`ingest/derive.py`](ingest/derive.py)) | ✅ built |
| **2. Discovery + Places**       | `place_id` + website URL (discovery); rating/review_count/website/email                        | services  | Google Places API                                                  | planned  |
| **3. ABR**                      | `abn`                                                                                          | providers | ABR API (free)                                                     | planned  |
| **4. Operator crawl**           | logo, description, philosophy, programs (brand); inclusions, languages, photos, email (centre) | both      | crawl per domain → Claude extraction                               | planned  |
| **5. Claim portal (the wedge)** | **fees, vacancies, owned photos**                                                              | services  | centre self-serve (also seeds the CRM)                             | planned  |

**Settled data-provenance rules (do not relitigate):**

- **Free consumer product for now — no feed sold yet.** Image/content provenance purity is a _future_ concern that activates when we monetise the feed, NOT a launch blocker. At the free stage we sit in the same posture as any directory / Perplexity: proxy + attribute + honour takedowns.
- **Google content (Places photos, reviews, rating, Street View) is render-time-only — NEVER stored.** It's an API-contract limit (storing risks the key), and the photo URLs expire anyway. Store **only `place_id`** (the one field Google lets you keep); fetch photos live off it, build Street View URLs live off lat/lng.
- **Stored photos** live in `services_meta.photos` JSONB as **tagged URLs, not bytes**: `{ "url", "source": "operator-website" | "claim-portal", "fetched_at" }`. Only those two sources ever appear (no `"google"`, no `"streetview"`). Serve via `next/image` `remotePatterns` (edge-proxied/optimised, not raw hotlinked). `operator-website` URLs are **provisional placeholders**; the **claim portal** lets a centre upload owned photos (`claim-portal`, bytes we host = the only resellable image asset) and **remove** any `operator-website` URL — that removal _is_ our takedown mechanism and a reason for centres to claim.
- **age range** inferred from service-type flags (LDC 0–5, preschool 3–5, OSHC 5–12, FDC 0–12; widest span across a service's flags).
- **No competitor crawling** — what we lack from them (fees/reviews/photos) is the copyrighted/Google-owned data anyway; benchmark only.
- `ingest/derive.py` is safe to re-run (overwrites only Stage-1 cols).

**Internal ids (built):** `services.id` and `providers.id` are `BIGINT GENERATED ALWAYS AS IDENTITY` — stable, regulator-agnostic handles whose base36 form is the public URL `{code}` (`/childcare/{code}/{slug}`, `/brands/{code}/{slug}`; see URL rule in conventions). They're never in `load.py`'s upsert lists, so the daily sync never disturbs them. The approval numbers stay the data join keys. Slugs are cosmetic / 301-able (`name-suburb-postcode` for services, brand name for providers) — the `{code}` carries uniqueness.

### Enrichment crawler — `ingest/crawl/crawl.js` (the keyless scraper)

> **WHEN THE USER SAYS "check what we scraped for the `_meta` tables" — this is what they mean.** They want me to audit the data this crawler wrote into `services_meta` (and what still needs rolling up to `providers_meta`). Start by reading this section, then run the coverage query below and a quality spot-check (sample real rows; look for junk/false matches), and report coverage % per field. Do NOT re-derive the approach — it's settled here.

**What it is:** a Node/Puppeteer crawler (`ingest/crawl/crawl.js`). For each service it: searches **DuckDuckGo HTML** → picks the centre's own site (filters out directories/social/gov via the `BLOCK` regex) → fetches it → **verifies** the page mentions the centre's name/suburb → scrapes **email** (+ `/contact` fallback), **photos** (real `<img>` tags — carousel/slider/gallery/hero first, then any content image; junk-filtered, capped 6), and **brand logo** (JSON-LD `logo` → header `img` with "logo" → apple-touch-icon/favicon) → writes to `services_meta`. **Photos are NOT from `og:image`** (that's an arbitrary share thumbnail / often the logo — decided, don't reintroduce it); a positive `GOODIMG` extension check + `BADIMG` junk filter keep logos/icons/`/cron`-pixels out, and the detected logo is explicitly excluded from `photos`.

**Run modes:**

- **Full / mop-up:** `node crawl.js --limit 20000 --workers 5` — pulls rows with `discovered_at IS NULL` (un-crawled), then run again to mop up.
- **`--refresh`:** re-process EVERY row. Rows that already have a `website` skip discovery and just get re-inspected with current logic (lossless — no re-gamble on DDG); rows with no site still get full discovery. Use it to re-scrub all rows (e.g. after improving photo/logo extraction). One `--refresh` pass folds in the mop-up too.
- **`--retry-blocked`:** re-process ONLY the rows in `blocked.csv` (re-inspect their known URL on fresh IP draws). Rotates the old `blocked.csv` to `blocked.prev.csv` first, so the new `blocked.csv` ends up holding just the still-failing residual. Run it a couple times; the residual converges to genuine WAF/404/dead-domain rows.

**Why this stack (decided, don't relitigate):** everything routes through **Webshare residential proxies** (20 static IPs, `WEBSHARE_PROXIES` in `ingest/.env`, $6/mo 250GB plan) because search engines + some operator WAFs block our datacenter/direct IP. **Puppeteer + stealth + DDG** (not plain HTTP) because plain `requests` gets DDG-rate-blocked AND 403'd by operator WAFs; the stealth browser passes both. A **plain-HTTP Python version was tried and deleted** as too low-yield. Google Places/SERP APIs and Oxylabs were considered and **declined** (keep it free). `acceptInsecureCerts: true` on launch (Puppeteer 23+ renamed it from `ignoreHTTPSErrors`) so expired/mismatched operator certs load instead of failing. Media (images/css/fonts) is request-blocked to save bandwidth.

**Pool design (decided):** **one browser per IP — ALL 20 — but only `--workers` rows run concurrently (default 5, < #IPs)**, so the pool always has idle IPs. A blocked row retries on a _different, not-yet-tried_ IP (exclude-aware pool + per-row tried-set); released IPs go to the back of a FIFO = built-in cooldown. IPs are tried **last-to-first** (the tail of `WEBSHARE_PROXIES` is treated as the freshest band). _Earlier `--workers 10` / one-browser-per-worker was wrong: it pinned only 10 of 20 IPs and let retries reuse the blocked IP. Don't go back to it._ Two retry stages: discovery (DDG, 4 distinct IPs) and inspect (operator site, 3 distinct IPs); a fully-blocked inspect keeps the site URL only and the UPDATE's `COALESCE` preserves existing enrichment (a block never wipes data).

**Failure logging:** every row that blocks out on all IPs is appended to **`ingest/crawl/blocked.csv`** (git-ignored) with `ts,stage,id,name,suburb,url,attempts` — `attempts` lists each IP tried and its reason (`HTTP 403`, `net::ERR_CERT_*`, timeout, etc.). The end-of-run **per-IP `ok/blk` table** is the proxy-health check: a band of IPs at ~100% blk = dead/expired proxies returning `HTTP 407` → re-pull the list from the Webshare dashboard and replace them in `.env` (format is `http://user:pass@ip:port`, comma-separated; Webshare exports `ip:port:user:pass` so convert).

**Resumable & safe:** confined to `services_meta` — never touches the spine or `web/`.

**Coverage check (run this for "what did we scrape"):**

```bash
psql -d kindello -c "SELECT count(*) FILTER (WHERE discovered_at IS NOT NULL) processed, count(website) sites, count(*) FILTER (WHERE website_verified) verified, count(logo_url) logos, count(*) FILTER (WHERE jsonb_array_length(photos)>0) photos, count(email) emails, count(*) total FROM services_meta;"
```

(Note: `count(photos)` over-counts — empty `[]` arrays from successful-but-imageless inspects are non-NULL; filter on `jsonb_array_length(photos)>0` for real photos.) Fields written: `website`, `website_source` (`'search-ddg'`), `website_verified`, `email`, `logo_url`, `photos` (JSONB `[{url,source:'operator-website',fetched_at}]`).

**Status: FULL CRAWL DONE (2026-06-20).** All 18,229 rows processed. Final coverage: **18,227 websites, 17,038 logos (93%), 14,031 verified (77%), 13,418 photos (74%), 10,925 emails (60%)**; **~180 rows stuck** in `blocked.csv` (mostly genuine `HTTP 403` WAF + `404` dead/false-positive URLs — these are the manual-image / URL-cleanup candidates, not worth more automated retries). **Open TODO:** (1) roll centre `logo_url` up to `providers_meta.logo_url`/`website` per brand (dedupe by domain) for the `/brands` pages; (2) triage the ~50 `404`/garbage stored-website rows (e.g. false-positive discoveries like `m.fanfox.net`) — null the bad `website`; (3) `/contact`-page email coverage could be widened.

## Tech stack

| Layer                   | Choice                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ingest pipeline         | **Python** (`ingest/`) — small dataset, no pandas needed                                                                                                                                                                                                                                                                                           |
| Database                | **PostgreSQL 18** local (Homebrew, port 5432) → Neon (cloud) **only for demos** (see [[local-poc-then-cloud-for-demos]]). **PostGIS installed + enabled** (3.6.4) for radius search. pgvector (embeddings) still to add. _Was @17; upgraded to @18 because Homebrew PostGIS targets @18 — old @17 data backed up at `backups/kindello_pg17.dump`._ |
| Web app / API / chatbot | **TypeScript / Next.js 16** (`web/`, built) — matches the scraper-saas-starter stack. UI on **prompt-kit + shadcn/ui** (Tailwind v4), light/dark mode via `next-themes`                                                                                                                                                                            |
| Chatbot                 | Claude (`claude-opus-4-8`); hybrid retrieval = structured SQL filters (geo/rating/vacancy) + vector search; tool-calling agent. Use the `claude-api` skill for current model IDs when building.                                                                                                                                                    |
| Proxies                 | Webshare (residential/rotating) to reach WAF-blocked open-data sources                                                                                                                                                                                                                                                                             |
| Browser automation      | **Playwright MCP** (`@playwright/mcp`) — drives a real local browser to perform ACECQA's own public CSV export (the clean route past the WAF). Added to project MCP config; tools load after a Claude Code restart.                                                                                                                                |

## Data sourcing — important

The official sources **WAF-block automated requests** (HTTP 403 to scripts; a real browser passes):

- ACECQA registers: `acecqa.gov.au/resources/national-registers` — 403 even via current Webshare proxies (403/ProxyError).
- Federal catalogue `catalogue.data.infrastructure.gov.au` — its CKAN API IS reachable via Webshare proxy, **but** the ACECQA dataset there (`rdh-nationalregistersofapprovededucationandcareservices`) is just a pointer: 1 HTML resource linking back to ACECQA, **no CSV files hosted**.
- `data.gov.au` CKAN API is open but only carries a tiny QLD "QEC" sub-register (43 rows, no ratings) — not useful.
- **StartingBlocks.gov.au** (ACECQA's consumer finder, same data) IS reachable via Webshare proxy (HTTP 200). It's a **Next.js app** whose service search is powered by **Algolia**, with Next API routes (`/api/getServiceById`, `/api/getServicesByProviderIds`, `/api/getProviderById`).

**Decision (do not revisit):** we will **not** harvest StartingBlocks' Algolia app ID / search key to bulk-pull their index. It uses another party's front-end credentials against their terms, breaks on key rotation, and is an indefensible provenance story for a product we sell to directories. Auto-mode guard correctly blocked this; leave it blocked.

**Chosen route (CONFIRMED WORKING):** ACECQA's own public "export to CSV". The WAF only blocks **datacenter/proxy IPs** — a plain `curl` from the local **residential IP** (with a normal browser User-Agent) returns **HTTP 200**. No Playwright, no Webshare proxy needed for downloading; Playwright was only used once to discover the export URLs. There is a single national **Australia** export covering all states (no per-state looping, no pagination cap):

- Services: `https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-au-export.csv`
- Providers: `https://www.acecqa.gov.au/sites/default/files/national-registers/providers/Approved-providers-au-export.csv`
- (per-state variants exist: `.../Education-services-{act,nsw,nt,qld,sa,tas,vic,wa}-export.csv`)

Downloaded **2026-06-18**: **18,229 services** (98 cols) + **10,737 providers** (10 cols) — full national coverage, exceeds the ~16.5k estimate. `ServiceType` is only `Centre-Based Care` / `Family Day Care`; the LDC/OSHC/Preschool distinction lives in 7 boolean flag columns. In parallel, still pursue an **official ACECQA data agreement** for the sustainable production feed + clear licensing.

**Production daily refresh:** `curl` the two national URLs from a residential-IP box (or the official feed), then `python ingest/load.py`. If run from a cloud/datacenter IP the WAF will 403 — route via residential proxy or run on-prem.

Legal: ACECQA register data is public/open (CC-BY where catalogued). Scraping StartingBlocks fees/vacancies is greyer — prefer a "claim your listing" portal for that data.

## Folder structure

```
kindello/
  CLAUDE.md            # this file
  README.md
  .gitignore           # ignores data/raw CSVs, .env, .venv, node_modules
  data/raw/            # downloaded CSVs (git-ignored): acecqa-services-au.csv, acecqa-providers-au.csv
  ingest/
    .venv/             # python venv
    requirements.txt   # psycopg, python-dotenv, requests
    .env               # DATABASE_URL + WEBSHARE_PROXIES (git-ignored, never commit)
    .env.example       # placeholders only — keep credential-free
    download_acecqa.py # legacy Webshare/CKAN downloader — superseded by plain curl (see sourcing)
    schema.sql         # providers + services spine tables (idempotent)
    load.py            # parse CSVs -> upsert into Postgres (preserves enrichment cols on conflict)
    explore.sql        # handy exploration/sanity queries incl. §4 PostGIS "near me" persona searches
    gnaf_load.py       # OPTIONAL: bulk-load full G-NAF into Postgres (needs ~10GB+ disk; unused locally)
    geocode_gnaf.py    # geocoder: stream G-NAF PSVs, match centre addresses, fill services lat/lng
    gis.sql            # PostGIS: enable extension + services.geog generated column + GiST index
    search.py          # chatbot tools: resolve_location(text) + search_centres(lat,lng,...); CLI for persona tests
  backups/             # pg_dump backups (git-ignored): kindello_pg17.dump (pre-@18 upgrade)
```

## Rules / conventions

- **NEVER write code or make changes without explicit permission, or proper discussion and planning first.** When the user is discussing, exploring options, or asking a question (especially anything framed "discuss", "should we…", "what do you think"), STAY in discussion — do not edit files, run migrations, or "just implement it" because the direction seems agreed. Reading/grepping to ground the discussion is fine; mutating the repo is not. Wait for an explicit go-ahead ("do it", "implement", "go ahead") before touching anything.
- **Commits:** do NOT add a `Co-Authored-By: Claude` trailer (or any AI co-author line) to commit messages. Commit only when explicitly asked.
- **Browser/Playwright:** do NOT launch Playwright or drive the browser to verify changes unless the user asks for it, or you've asked permission first. Prefer reasoning, typecheck, or build to confirm a change; reach for the browser only on request.
- **Secrets:** real credentials live ONLY in `ingest/.env` (git-ignored). `.env.example` stays placeholder-only — `.env.example` IS committed.
- **Launch phase — technical SEO is now IN scope.** _(Was: "PoC, skip technical SEO" — flipped 2026-06-19 now that we're launching a public directory.)_ We DO now invest in indexation, XML sitemaps, `robots.txt`, canonicals, and structured-data/JSON-LD (childcare/LocalBusiness schema) — these matter for a consumer directory competing with CareForKids/KindiCare on organic. Keep doing the copywriting and page-structure work too (clarity, tonality, content hierarchy, honesty of claims); SEO plumbing is additive, not a replacement.
- **Service detail URLs = `/childcare/{code}/{slug}` (id + slug pattern, CareForKids-style).** `{code}` = base36 of the internal `services.id` (stable, permanent, regulator-agnostic — the URL never breaks); `{slug}` = `name-suburb-postcode` from `services_meta.slug` (human/SEO readable, **changeable** → on mismatch 301 to the canonical slug for that code). `service_approval_number` (ACECQA) stays the **data** join key; the base36 code is the **URL** key. Do NOT put the raw ACECQA number in public URLs (leaks the regulator's scheme; breaks if re-issued).
- **Reuse the existing UI components — don't invent new ones.** The full design system lives in **`web/components/ds/*.tsx`** (18 components: `Button`, `Tag`, `RatingBadge`, `StarRating`, `PromptChip`, `UserBubble`, `Icon`, `CentreCard`, `PlaceResultCard`, `ContinueSearchCard`, `CategoryTile`, `GuideCard`, `MapPreview`, `ChatComposer`, `ConversationTabs`, `FollowUps`, `SiteHeader`, `SiteFooter`) plus the prompt-kit/shadcn primitives in `web/components/ui/*`. Before building any UI, **check `web/components/ds/` first** and compose/extend what's there. Only create a new component if nothing fits — and match the existing conventions (Tailwind utility classes + `cn()`, the `@theme` tokens in `app/globals.css`, a `style` pass-through prop). All styling is Tailwind now; **do not reintroduce inline `style={{}}`** except for genuinely runtime-dynamic values (data-driven gradients, `size`/position props, `animationDelay`, `color-mix`). _(The original `design-system` skill these were ported from has been deleted; `web/components/ds/` is now the single source of truth.)_
- **One reusable map component, varied by props — pin + place-card UI are always shared.** Different pages need different map _behaviour/layout_ (Finder = interactive directory with Search-this-area, click-to-open cards, visited states, optional on-screen list; chat Answer tab = preview with floating cards; centre detail = single static location). Do NOT fork into per-page map components. Keep ONE map (`web/components/ds/map-preview.tsx` + `mapbox-map.tsx`) and express the differences through **props** (e.g. `interactive`/`onRegionChange` for Search-this-area, `showList`/layout flags for an on-screen places list, `onPinClick`/`renderCard`, clustering toggle). Page-specific behaviour must be **opt-in (default off)** so simple consumers (chat, detail) don't inherit directory behaviour (no stray popups, no `localStorage` visited writes). The **internal pin (`ds/rating-pin.tsx` → `pinSvg`/`RatingPin`) and the place/popup card (`ds/pin-card.tsx` → `PinCard`) are the shared atoms** — identical UI on every map. NOTE (current debt): the Finder interactivity (4 pin states, click→`PinCard` popup, visited localStorage) currently lives unconditionally inside the shared `mapbox-map.tsx` and leaks onto the chat/detail maps; gate it behind the opt-in props above.
- **Schema-from-real-data:** inspect actual CSV columns before designing tables; don't guess the schema.
- Keep all project files inside this repo. Postgres binaries / `brew` are system-level (unavoidable).
- Design lat/lng as plain numeric now; upgrade to PostGIS `geography` later without a rewrite.

## Commit messages

Going-forward standard: **Conventional Commits** — `type(scope): subject`. (The two existing commits predate this and use a descriptive sentence style; don't treat them as the template.) The two commit _rules_ in "Rules / conventions" above still apply: never commit/push without explicit instruction, and never add a `Co-Authored-By` line.

- **Types:** `feat` (new capability), `fix` (bug fix), `chore` (deps/config/tooling/housekeeping), `docs` (docs/comments incl. this file), `refactor` (restructure, no behaviour change), `style` (formatting only), `test` (tests), `perf` (performance).
- **Scope** (optional): lowercase, names the area touched — e.g. `ingest`, `geocode`, `gis`, `search`, `web`, `chatbot`, `schema`, `docs`. Omit if it spans many.
- **Subject:** imperative mood ("add", not "added"), lowercase first word, no trailing period, ≤ ~72 chars.
- **Body** (optional): explain _why_, not _what_; blank line after subject; wrap at ~72 chars.

Examples (illustrative — the existing log predates the convention):

```
feat(search): resolve location to biggest suburb cluster
feat(web): render search results as centre cards
fix(geocode): strip Unit/Lot prefixes before G-NAF match
docs: document daily ACECQA curl refresh route
```

## Status / what's built

- [x] Local Postgres 17 running; empty `kindello` database created (only `plpgsql` ext).
- [x] Repo scaffold: `.gitignore`, `README.md`, `ingest/` venv + deps.
- [x] `download_acecqa.py` — Webshare proxy downloader; confirmed it defeats the WAF on the CKAN catalogue API.
- [x] Sourcing investigated: catalogue entry is a pointer; StartingBlocks is Next.js+Algolia (rejected as a source on provenance grounds).
- [x] Playwright MCP added — used once to discover the export URLs. **Then found plain `curl` from the residential IP returns 200**, so Playwright/proxies are not needed for downloads.
- [x] **Downloaded the national CSVs** (18,229 services + 10,737 providers) into `data/raw/` via curl.
- [x] **Schema built** (`ingest/schema.sql`): `providers` + `services`, with `operating_hours` JSONB (56 time cols collapsed) and enrichment placeholders (`latitude`/`longitude`/`last_geocoded_at`).
- [x] **Ingest/load script** (`ingest/load.py`): typed transforms, upsert preserving enrichment cols, auto-stubs missing providers. Loaded 18,229 / 10,738 verified.
- [x] **Geocoding via G-NAF** (`ingest/geocode_gnaf.py`): **92.7% geocoded** (16,896/18,229 — 14,307 building-level exact + 2,585 street-level), all within AU bounds. See "Geocoding" below.
- [x] **Upgraded local DB @17 → @18** (dump/restore; all data + geocoding preserved; backup at `backups/kindello_pg17.dump`).
- [x] **PostGIS enabled** (`ingest/gis.sql`): `services.geog` GENERATED `geography(Point,4326)` column from lat/lng + GiST index. **Radius search works** (`ST_DWithin` + `<->`, ~0.08ms, index-backed). Persona "near me" queries in `explore.sql` §4.
- [x] **Search tools built** (`ingest/search.py`): `resolve_location(text)` (postcode/suburb → centroid from our own geocoded data, no API) + `search_centres(lat,lng,radius,care_type,min_rating)` over the PostGIS query; returns dicts + Google-Maps links. CLI validated across toddler/LDC, school-age/OSHC, quality-first persona profiles.
- [x] **Chatbot web app** (`web/` — Next.js 16 + Vercel AI SDK + Tailwind v4): tool-calling agent that maps free text → `resolveLocation`/`searchCentres` (TS ports of `search.py`) over Postgres, with a **multi-provider model dropdown** (Claude/GPT/Gemini). Verified locally (page renders, DB path works, typecheck + prod build clean). Pending: provider API keys in `web/.env.local`. See "Web app" below.
- [x] **UI rebuilt on prompt-kit + shadcn/ui** (Tailwind v4): teal `#1CA6A6` brand, **light/dark mode** (`next-themes`), centered fresh-session composer, animated suburb placeholder. See "Web app" below.
- [x] **Full directory frontend on the design system** (now lives entirely in `web/`; the source `design-system` skill has been deleted — `web/components/ds/` is the single source of truth): DS tokens registered in `web/app/globals.css` (`@theme`); 18 DS components in `web/components/ds/*.tsx` (all Tailwind utility classes + `cn()`, no inline styles bar runtime-dynamic values); shared `SiteHeader`/`SiteFooter`/`MapPreview`. Pages: **homepage `/`** (server-rendered marketing — hero + Popular/Browse/Areas/Guides/FAQ off real ACECQA data — with the **AI chat layered on as a client state** via `components/home/*`: Answer tab w/ map preview + floating cards + "Best near" list + follow-ups, Places tab, New search, returning-visitor "Pick up where you left off" + sessionStorage thread persistence); **`/search`** results grid (featured + 3-up `CentreCard`, live URL filter bar); **`/centre/[id]`** SEO detail page (real spine + 7 NQS quality areas + representative programs/features/reviews/FAQ, `generateMetadata`). Reuses the existing `/api/chat` + `lib/tools.ts` backend (added lat/lng + id to `searchCentres` output). Typecheck + prod build clean.
- [x] **Real map wired** (`web/components/ds/map-preview.tsx` + `mapbox-map.tsx`): when `NEXT_PUBLIC_MAPBOX_TOKEN` is set, `MapPreview` renders **Mapbox GL** (light/dark street style via `next-themes`, `fitBounds` to the points, teal teardrop rating markers reusing `pinTone`, labels when `showLabels`); unset → the styled placeholder still renders so nothing breaks locally. mapbox-gl is lazy-loaded via `next/dynamic` (`ssr:false`) so it only ships when a token is present. Same `MapPoint`/props API — callers (chat Answer/Places tabs, centre detail) unchanged. Set the free `pk.` token in `web/.env.local` + restart dev. _(Leaflet/OSM no-key variant is the alternative if avoiding signup.)_
- [x] **Suburb page is now RADIUS-based + "Search this area" / "Zoom in to search" (BUILT).** Decided 2026-06-20 (un-parks the earlier "wait"): the `/childcare/{suburb}/{postcode}` default render is no longer the strict suburb match (Marsfield's 3 rows) — `getSuburbPage` anchors on the suburb centroid and radius-searches around it (`SUBURB_RADIUS_KM = 5`, capped `AREA_LIMIT = 50`, nearest-first), blending nearby suburbs like KindiCare/Toddle so Marsfield now shows ~50 instead of 3. Heading stays "Childcare in {suburb}" (SEO); intro says "in and around {suburb}" for honesty. The map (and `/{careType}/...` variants) is interactive like the Finder: panning/zooming offers **"Search this area"** or **"Zoom in to search"** below the `MIN_SEARCH_ZOOM` floor (same `AreaPrompt` mechanism in `mapbox-map.tsx`). The re-query is **deterministic** (`getAreaCentres` in `lib/directory.ts` → `/api/directory-area`, same `DirectoryCentre` shape, ONE query so the "N centres" count == list length; NOT the AI chat path), updating the **list + stats + map together**. After a "Search this area", the **heading flips to "Childcare in Map Area"** and the toolbar location shows a removable **"Map Area" chip** (competitor-style); a "Back to {suburb}" reset / clearing the chip restores the suburb view. Architecture: `suburb-directory.tsx` = **server shell** (care links / intro / heading), `suburb-results.tsx` = **client island** owning the shared toolbar+list+map state — it `import type`s from `lib/directory` only, so `pg` never reaches the client bundle.
- [ ] **Suburb-page duplicate-content posture — radius blend ACCEPTED; intro must be data-grounded (DECIDED 2026-06-20).** The radius blend means adjacent suburbs (Marsfield/Eastwood/Epping) return a largely overlapping centre set. That's fine and matches KindiCare/Toddle/CareforKids — Google does not penalise two _local_ pages for sharing some of the same listings. The real risk is **page-level** near-duplication, so each suburb page must be differentiated on its own content (H1 + intro + stats are already per-suburb). **Rule: the per-suburb intro must be composed deterministically from real DB facts (in-suburb vs surrounding count, NQS distribution, care-type coverage from `stats.byCare`, named nearby suburbs), never name-swapped boilerplate and never ungrounded "lifestyle" prose (population, "leafy family suburb") — that invites hallucination + the Helpful-Content spun-content penalty.** Deterministic compose, not an LLM-per-page call (cost/latency/honesty). Generator sketch + plumbing in `CODE_REVIEW.md` §H1 (TODO: wire `buildSuburbIntro` into `getSuburbPage`/`suburb-directory.tsx`, expose strict in-suburb count). Open: gate `app/sitemap.ts` to suburbs above a min centre count so thin 1–2 centre pages aren't shipped to Google.
- [ ] **Reviews/photos/fees/age-range on the directory pages are representative placeholders** (deterministic per centre, anchored to the real NQS tier — see `web/lib/directory.ts`) pending Google Places (Tier-2) enrichment. Everything else (name, address, NQS, approved places, hours, phone, quality areas) is real ACECQA data; the chat answer text stays honesty-bound by the existing system prompt.
- [ ] **Directory filter toolbar — only the filters we have real data for (DELIBERATE).** The suburb/care-type results toolbar (`web/components/directory/results-toolbar.tsx`) ships **Care type + NQS rating** only. The competitor (CareforKids) also shows **Vacancy, Reviews, Age, Price, Offers** (and a Sort) — we intentionally **omit these because we don't hold the data**, and faking them breaks the honesty rule. There is **no Sort** on these pages by product decision (`getSuburbPage`/`getAreaCentres` keep an optional `sort` defaulting to rating-order, just not UI-driven). Unlock map (each filter ← the enrichment that powers it): **Vacancy** ← first-party enquiry/WhatsApp vacancy signal (Phase 2–4); **Reviews** ← Google Places (Tier-2); **Price** ← fees enrichment (Tier-2 / claim-your-listing); **Age** ← room/age-range data (not in ACECQA spine); **Offers** ← supply-side/claim channel. Add each filter only when its real data lands.
- [ ] pgvector for semantic search (fuzzy "philosophy/vibe" queries beyond structured filters).
- [x] **Finder map — "Search this area" + zoom-floor gating (BUILT).** The `/finder` map re-queries on user pan/zoom: a `moveend` (guarded by `originalEvent` so programmatic `fitBounds` doesn't trigger; movement/zoom threshold so tiny nudges don't) emits an **area prompt** from `mapbox-map.tsx` → `onRegionChange`, and `results-canvas.tsx` shows the pill. Radius is derived from the **live viewport bounds** (centre→corner), clamped to `MAX_AREA_RADIUS_KM` (30). The zoom-out gate is a **search floor** `MIN_SEARCH_ZOOM` (12.5): below it we show **"Zoom in to search"** instead of "Search this area" — tapping it eases the camera back to the floor (`zoomInTick` signal → map `easeTo`) and auto-runs the search for that view (one tap). Hard floor `MIN_MAP_ZOOM` (10) lets users pull back for context but not to uselessness. The prompt is a 3-state union (`AreaPrompt` = `search` | `zoom-in` | `null`). Still caps at `DEFAULT_CANVAS_LIMIT` (50); the `FacetLine` shows shown-vs-total.
- [ ] **Finder map — clustering (PARKED, decided).** On zoom-out, collapse overlapping pins into count bubbles. **Decision: use `supercluster` + our existing DOM markers** (NOT native Mapbox GL GeoJSON clustering), to preserve the custom tiered SVG pins, the 4 states, and the React `PinCard` popup. Cluster click → zoom to bounds; co-located leaves at max zoom → open `PinCard` as a **carousel** (`centres[]` + prev/next). Clustering moots the cap (only ~dozens of bubbles ever render) and improves perf, so the 50-cap can rise once it lands.

## Web app (`web/`) — directory (primary) + parked chatbot

_Post-pivot the **directory** is the launch product (server-rendered suburb/care-type/centre pages on `web/components/ds/` + Mapbox, deterministic Postgres search via `/api/search` + `/api/directory-area`). The **chatbot** below is the **parked `/finder` surface** + future widget; its plumbing still applies but it is not the main flow._

Next.js 16 (App Router, TS, Tailwind v4) — **this is Next.js 16, newer than training data; read `web/node_modules/next/dist/docs/` before writing Next code** (per `web/AGENTS.md`). Model calls go through the **Vercel AI SDK** (`ai` v6) — chosen deliberately for cross-provider model testing (user may not commit to Claude). Claude never touches Postgres: it requests tool calls, the route runs the matching TS function (`lib/tools.ts`) which queries Postgres/PostGIS, and rows go back as text.

- `lib/db.ts` — shared `pg` Pool. `lib/models.ts` — client-safe model registry (dropdown). `lib/provider.ts` — server-only `modelFor()` (maps id → `@ai-sdk/{anthropic,openai,google}`). `lib/tools.ts` — `resolveLocation` + `searchCentres` (TS ports of `ingest/search.py`). `lib/persist.ts` — `saveChat()` writes transcripts.
- `app/api/chat/route.ts` — `streamText` + tools, `runtime="nodejs"` (pg needs Node), model + `sessionId` picked per request; `onFinish` → `saveChat`.
- `app/page.tsx` — chat UI (`useChat`) built with **prompt-kit** components (`components/ui/*` — `prompt-input`, `message`, `markdown`, `loader`, `prompt-suggestion`, `chat-container`, `scroll-button`; pulled via `npx shadcn add https://www.prompt-kit.com/c/*.json`). Sends `{ body: { model, sessionId } }` per message. UX: **fresh session = hero + composer centered** (ChatGPT/Claude style), drops to bottom once chatting; **animated typewriter placeholder** cycling AU suburbs on the fresh state, static "Write a message…" once active; model dropdown sits **right of the send button** inside the composer toolbar (native `<select>` needs `stopPropagation` on click/mousedown or PromptInput's root focus-steal closes it).
- **UI foundation = shadcn/ui (new-york, stone base) on Tailwind v4** — `lib/utils.ts` (`cn`), `components.json`, themed `app/globals.css` (CSS-var light/dark tokens; **brand primary teal `#1CA6A6`**; `@tailwindcss/typography` for markdown; global `button:not(:disabled){cursor:pointer}`; **`@keyframes typing`** for the bouncing loader dots — prompt-kit's `TypingLoader` references `animate-[typing_1s_infinite]` but doesn't ship the keyframe, so without it the dots sit static). **Dark mode** via `next-themes`: `components/theme-provider.tsx` (in `layout.tsx`, `attribute="class"`, system default) + `components/theme-toggle.tsx` (sun/moon, guards hydration with a mounted flag).
- **Results render as cards, not text** (`components/centre-card.tsx`): `page.tsx` reads each `tool-searchCentres` part's `output` (state `output-available`) and renders `<CentreResults>` — per-centre card with NQS badge (tiered colours), distance, address, **hours summary** (`summariseHours` collapses the `operating_hours` JSONB into "Mon–Fri 7:30am–6pm"), approved places, phone (`tel:`) + Directions (`maps_link`). The system prompt tells the model NOT to re-list centres in text — just a 1–2 sentence intro above the cards. (Error results `{error}` are skipped, not carded.)
- **Tool output contract:** the model can only use/surface what `searchCentres` SELECTs and what the system prompt tells it to present — both matter (the "no phone" bug was a missing SELECT field AND a presentation list that didn't ask for it). Currently returns name/address/suburb/postcode/rating/**phone**/**operating_hours**/places/distance/maps_link.
- **`resolveLocation` gotchas (both fixed in `web/lib/tools.ts` AND `ingest/search.py`, kept in parity):** when debugging "found nothing", check the saved transcript (`chat_messages.parts`) for the tool `input`/`output` — these failures are upstream in `resolveLocation`, not `searchCentres`.
    1. **"Suburb, STATE" punctuation:** models phrase locations as `"Glebe, NSW"`; the old regex left the comma on the suburb (`"Glebe,"`) → 0 rows → `{error}` → weak models (gpt-4o-mini) gave up _without ever calling `searchCentres`_. Fix: strip commas + collapse whitespace before parsing; fall back to suburb-only if a state guess misses.
    2. **Same suburb name in multiple states:** `"Carlton"` exists in VIC (9) and NSW (6); averaging lat/lng across all of them gave a centroid in **rural farmland near Albury** (the midpoint), matching nothing within 5km. Fix: `GROUP BY state ORDER BY count DESC LIMIT 1` — resolve to the **biggest cluster** (one real place), and put the resolved state in the `label` (e.g. "Carlton, VIC") so it's visible which one was picked.
- **Chat logging** (`web/db/schema.sql`): `chat_sessions` + `chat_messages` (full `parts` JSONB incl. tool calls) in the same Postgres. Lets us review conversations to debug the agent, resume old chats, and seed the CRM. New session id per page load (refresh = new chat, for now). Review by querying `chat_messages` directly.
- **Location UX (decided):** typed location is **primary** (chat-native, works in embeds, captures true intent — parents search home/work/a suburb, not their GPS); browser geolocation only as an **opt-in "use my location" tap**, never auto-prompted on load. Backend already supports both (`resolveLocation(text)` vs `searchCentres(lat,lng)`). Geolocation in the embedded widget needs the host site's `allow="geolocation"`.
- **Maps preview:** free option = Maps **Embed API** iframe (we have lat/lng). Real centre **photos** = Places API (paid, Tier-2 enrichment, cache it) — competitor hosts its own cover images + claim-uploads instead. Show a map only on expand, not per list row (cost/perf).
- **Run:** `cd web && npm install && cp .env.example .env.local` → fill `DATABASE_URL` + provider keys → `npm run dev`. **Restart the dev server after editing `.env.local`** (Next only reads env at boot). Note: if port 3000 is taken it uses 3001.
- **Env precedence gotcha:** a provider key already exported in the **shell** overrides `.env.local` (Next won't override an existing env var). If a key 401s despite being right in the file, check `printenv ANTHROPIC_API_KEY` — `unset` the stale shell var. Google/Gemini key must be under `GOOGLE_GENERATIVE_AI_API_KEY` (not `GEMINI_API_KEY`).
- Env: `.env.local` (git-ignored, real) vs `.env.example` (committed template). Keys: `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` — only need the providers you select.
- [ ] Maps-link fallback for the ~7.3% ungeocoded (see Geocoding "Gotcha"); optional: geocode the hard tail via API.
- [ ] Further enrichment (Google Places, fees/vacancies, ABN). Web app, B2B API.
- [ ] **Retry-with-backoff on provider 429s** in `app/api/chat/route.ts` — catch rate-limit errors, honour the provider's `try again in Ns` hint with a bounded exponential backoff, and surface a brief "one moment" state instead of a hard failure. _Why:_ OpenAI Tier 1 caps `gpt-4o` at **30,000 TPM** (input+output, rolling 60s, all concurrent requests; separate per model). A single chat turn re-sends system prompt + history + `searchCentres` rows (~12k tokens), so two or three quick messages burst past 30k and OpenAI returns `429 rate_limit_exceeded` (`Limit 30000, Used 25501, Requested 12052. Please try again in 15.106s`). Retry/backoff makes the burst recover gracefully; the durable fix is a tier bump (Tier 2 = 450k TPM) and/or trimming per-request tokens (fewer SELECTed fields, cap carded results).

## Geocoding (G-NAF)

Coordinates come from **G-NAF** (Geoscape Geocoded National Address File) — free, authoritative AU open data, **redistributable** (clean licensing for the feed we sell; read the "Open G-NAF Use Restriction" sheet before selling). Updated **quarterly** (Feb/May/Aug/Nov); current load = **MAY 2026**. Competitor KindiCare follows the same pattern: store one coordinate per centre, use a map lib only for display — they do NOT geocode on page load.

- **Source:** full relational G-NAF zip (~1.6GB) from data.gov.au dataset `geocoded-national-address-file-g-naf` (GDA2020 datum). Only `data.gov.au` carries the full G-NAF; the simpler "G-NAF Core" single-file is behind Geoscape's own portal.
- **Why streaming, not a DB table:** the laptop only has ~6GB free disk; the full ~16M-row G-NAF won't fit in Postgres, and centres span ~60% of AU postcodes so a postcode filter doesn't help. `geocode_gnaf.py` therefore **streams the PSVs once and keeps only the ~18k matched rows** (small in-memory street dict). `gnaf_load.py` (full bulk load into a reusable `gnaf_address` table) is kept for when we're on cloud Postgres with real disk.
- **Match key:** `(postcode, normalised-full-street, street-number)`. The parser picks the comma-segment that has a street number ("building, street" vs "street, suburb"), strips Unit/Lot/Shop prefixes + slash forms, and expands type abbreviations (`Dr`→`DRIVE`) to match G-NAF's full words. Tier 1 = exact building; Tier 2 = any point on the street (no number / number not in G-NAF).
- **Re-run:** `python ingest/geocode_gnaf.py` (only ungeocoded rows) or `--all`. Needs the extracted PSVs in `data/raw/gnaf_psv/` (re-download + unzip the quarterly release when it changes).

### Gotcha — we do NOT need 100% geocoding (two separate jobs)

There are two distinct location needs, and they have different requirements:

1. **"Open in Google Maps" / get directions** — needs **no coordinates**. Just build a link from the centre name+address and let Google resolve it on click:
   `https://www.google.com/maps/search/?api=1&query=<name>+<address>`
   This is exactly what competitor KindiCare does for centres it can't geocode (verified: their `details-basic-info` API returns `geolocation: null` for One Tree Kowanyama, and the page just emits a maps link with `destination_place_id=null`). So the **ungeocoded ~7.3% should fall back to a derived Google-Maps-link field** — they stay usable without a pin. (Not built yet — TODO.)
2. **"Childcare near me" / distance sort / map pins / chatbot's #1 query** — **coordinates ARE required on our side**, because the filter/sort happens in Postgres before any click. A maps link can't answer "10 closest centres". This is why we geocode and why KindiCare stores `centreLatitude`/`centreLongitude` per centre.

So: stored coordinates power discovery (92.7%); a name-based Google-Maps link covers the unmappable tail. **Don't burn effort chasing 100% geocoding** — the misses we saw are mostly remote/new addresses that even KindiCare (and Google Places) can't resolve either. Validation bonus: KindiCare keys on the same ACECQA IDs we do (`governmentCentreServiceId` = our `service_approval_number`), confirming the spine is identical.

## Local setup

```bash
brew services start postgresql@18          # NOTE: now @18 (PostGIS). @17 is stopped; don't run both (port 5432 clash).
export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"
cd ingest && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env   # then fill DATABASE_URL + WEBSHARE_PROXIES
psql -d kindello
```

Full local rebuild order: `psql -d kindello -f ingest/schema.sql` → `python ingest/load.py` → (download+unzip G-NAF to `data/raw/gnaf_psv/`) → `python ingest/geocode_gnaf.py` → `psql -d kindello -f ingest/gis.sql`. Local DB auth is `trust` (no password); connect with plain `psql -d kindello`.
