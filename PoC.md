# PoC.md — Kindello proof-of-concept plan

**Goal of the PoC:** prove the one core loop — *a parent types free text → gets the right centres back in chat* — running in the cloud, with the **one differentiator no AU directory has** (pedagogy/depth filtering) shipped on data we already hold.

**Success = a shareable URL** where you can type *"Montessori near Carlton"* or *"high-rated long day care near Bondi"* and get real, correct, nicely-presented results.

Scope discipline: PoC = "does the core loop work, and does it visibly beat a plain directory?" Everything in [brainstorm.md](brainstorm.md) outside this list is **MVP** — do not build it now. The rationale behind these choices is in brainstorm.md's "Key discoveries".

---

## Already built (carry over)

- [x] Spine in Postgres — 18,229 centres / 10,738 providers (name, address, phone, hours, places, type, **NQS rating + 7 areas**).
- [x] Geocoding — 92.7% via G-NAF; PostGIS `geog` + radius search working.
- [x] Search tools — `resolveLocation` + `searchCentres` (Python `ingest/search.py` and TS `web/lib/tools.ts`, kept in parity).
- [x] Parent chatbot web app — Next.js 16 + Vercel AI SDK, results render as cards, chat logging to Postgres.

---

## PoC work — to do

### 1. Pedagogy filter — the differentiator (build first; no cloud needed)
The one thing incumbents don't have, shippable today with zero enrichment.
- [ ] Add a keyword/`ILIKE` filter over `service_name` (and later description) for pedagogy terms: **Montessori, Steiner/Waldorf, Reggio, kindergarten/kinder, community, nature/bush, early learning**.
- [ ] Wire it into **both** `web/lib/tools.ts` (`searchCentres`) **and** `ingest/search.py` — keep parity (per CLAUDE.md gotcha).
- [ ] Expose it as a tool param (e.g. `philosophy`/`keyword`) so the agent maps "Montessori near Carlton" → location + keyword.
- [ ] Update the system prompt so the model uses it and **doesn't claim/hallucinate** a pedagogy it can't back (honesty guardrail — only what the name matches).
- [ ] Validate: "Montessori near Carlton", "bush kinder near Bondi", "Reggio in Fitzroy" return real, name-matched centres.

### 2. NQS plain-English explainer — cheap UI win (no cloud needed)
- [ ] Hardcode per-tier explainer text (Exceeding / Meeting / Working Towards / Significant Improvement Required / Not yet assessed) — official definitions.
- [ ] Show it on the centre card (tooltip/modal) alongside the badge + the 7-area breakdown we already store.
- [ ] Presentation only — no new data.

### 3. Display fallbacks — every result looks complete (no cloud needed)
- [ ] **Street View Static** image on the card keyed on the lat/lng we have → real building shot, no licensing risk.
- [ ] Fallback chain: Street View → Static Map tile → branded placeholder.
- [ ] **Maps link** for directions (name+address based) — covers the ~7.3% ungeocoded tail so every centre stays clickable.

### 4. UI/UX polish — Claude-design style (in progress)
- [ ] Current homepage moved to `/chat` (done); decide root `/` (redirect for now).
- [ ] Hero + composer, suggested prompts seeded with the **pedagogy queries** (show off the differentiator).
- [ ] Card layout: NQS badge + explainer, distance, hours summary, phone, directions, Street View image.
- [ ] Light/dark, responsive, loading states.

### 5. Cloud deploy — make it shareable
*Blocker: requires a Neon project (signup/billing) — create it, then paste the pooled connection string.*
- [ ] Create **Neon** project, region **AWS ap-southeast-2 (Sydney)**, Postgres 18.
- [ ] On Neon: `CREATE EXTENSION postgis;` `CREATE EXTENSION vector;` (vector now so it's ready; unused in PoC).
- [ ] Apply `ingest/schema.sql` then `ingest/gis.sql` against Neon.
- [ ] `pg_dump --data-only --table=providers --table=services` (local) → restore to Neon. (Generated `geog` recomputes from lat/lng; G-NAF not needed in cloud.)
- [ ] Sanity check: one `ST_DWithin` radius query against Neon returns rows.
- [ ] **Vercel** project: import repo, **Root Directory = `web/`**, Next 16 auto-detected.
- [ ] Vercel env vars: `DATABASE_URL` = Neon **pooled** (`-pooler`, `sslmode=require`) + `ANTHROPIC_API_KEY` (Claude-only for the demo).
- [ ] Use the pooled connection string + low `pg` pool `max` (serverless).
- [ ] Deploy, smoke-test `/chat` with the persona queries; confirm a transcript lands in `chat_messages` on Neon.

### 6. Demo readiness
- [ ] Warm Neon before demoing (free tier suspends on idle → ~1–2s cold start).
- [ ] 3–4 scripted demo queries that show: geo search, NQS quality, **pedagogy filter** (the wow), "near me".
- [ ] No custom domain (the `*.vercel.app` URL is fine — decided).

---

## Explicitly NOT in the PoC (all MVP — see brainstorm.md)

Fees · vacancies · real photos (Places) · website scraping · pgvector semantic search · WhatsApp write-agent · claim-your-listing portal · CRM · B2B API/widget · daily ACECQA sync · auth/metering.

---

## Suggested order

1. **Pedagogy filter** (§1) — the differentiator, self-contained, local.
2. **NQS explainer** + **display fallbacks** (§2, §3) — cheap card upgrades, local.
3. **UI/UX polish** (§4) — in parallel.
4. **Cloud deploy** (§5) — once the above work locally and you've created Neon.
5. **Demo prep** (§6).

§1–4 need no cloud and can proceed now; §5 unblocks the moment the Neon connection string exists.
