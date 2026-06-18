# brainstorm.md — Kindello feature ideas

A parking lot for features to **explore when we build the MVP**. Right now the focus is the **PoC** (prove the spine + geocoding + chatbot search work end-to-end) — nothing here is committed. Drop ideas freely; we'll triage into the roadmap later.

> Scope note: PoC = "does the core loop work?" (free text → location → centre results in chat). MVP = "would a directory pay to embed this?". Keep that bar in mind when promoting an idea from here.

## Discovery & chatbot

- **pgvector semantic search** — fuzzy "philosophy/vibe" queries (Montessori, play-based, nature kinder) beyond structured geo/rating filters.
- **Hybrid ranking** — blend distance + rating + vacancy + semantic score into one sensible default sort.
- **Multi-turn refinement** — "only ones with vacancies", "open before 7am", "under $130/day" as follow-up filters on a result set.
- **Comparison mode** — "compare these 3 centres" → side-by-side table (fees, hours, rating, places).
- **Saved searches / shortlist** — let a parent star centres and come back to them.
- **Explain the match** — short "why this centre?" line per result (close to you, rating 'Exceeding', has toddler places).

## Data & enrichment (the moat)

- **Vacancies & fees** — the highest-value, fastest-staling enrichment; via "claim your listing" portal first, scraping second.
- **Google Places** — reviews, photos, verified hours, phone (paid, Tier-2, cache hard).
- **ABN / ABR** — operator identity, link sibling centres under one provider.
- **Inclusions** — meals provided, nappies, incursions, languages, extra-curricular.
- **Maps-link fallback** for the ~7.3% ungeocoded so they stay clickable without a pin.
- **Freshness surfacing** — show `last_synced_at` per field; vacancies especially. It's a selling point.

## Location & map UX

- **Opt-in geolocation** — "use my location" tap (never auto-prompt); needs host `allow="geolocation"` in embeds.
- **Intent-triggered location prompt** — when the user types "near me" (or similar) without a place, surface a "Share your location" card above the composer; the button fires the browser permission prompt and we use the returned lat/lng for that search. Don't ask on load — only when the message actually needs it. **Explicit area always overrides shared location:** if the user then asks for a different suburb, search *that* area only — treat a named place in the latest message as authoritative over any stored geolocation (only fall back to the shared location when no place is given).
- **Map view** — pins + clustering; Maps Embed API iframe on expand only (cost/perf).
- **Travel-time search** — "within 15 min drive/walk" instead of straight-line radius.
- **Search by work + home** — centres near either, or on the commute between.

## Supply side (centres) — the monetisation path

- **WhatsApp write-agent (flagship supply-side idea)** — centres update vacancies/fees/hours and **upload PDFs** by chatting with an agent over WhatsApp. It's the parent bot *mirrored*: read-agent → write-agent, same Postgres, same tool-calling pattern. Removes the friction that kills every directory's vacancy data (busy directors won't log into a portal; they're already on WhatsApp). Writes land in `centre_meta` with provenance (`updated_by`, `source='whatsapp'`, `last_synced_at` = the freshness we sell). Uploaded docs split two ways: **structured fields → DB**, **chunked + embedded → vector store → the parent bot answers from the centre's own docs**. This closes the demand↔supply loop and is where pgvector finally earns its place (embedding first-party docs, not scraped guesses).
    - **Identity model:** verify the **root admin once** against an authoritative signal (code to the ACECQA-listed phone we already store, or operator-domain email; manual review for big operators). Then the admin adds **staff (name + number → scoped `allowed_service_ids[]`)**; adding a number sends a WhatsApp confirmation that **doubles as Meta-required opt-in**. WhatsApp self-authenticates the sender number (more spoof-resistant than SMS/email links) — so the channel *is* the login; we only verify the mapping (number → staff → centres). Roles (`admin` vs `editor`), revoke, many-to-many (area managers), and `updated_by` attribution (trust + audit + CRM signal). Validate writes against the spine (e.g. reject vacancies > approved places).
    - **Tech:** WhatsApp Business Cloud API (or a BSP like Twilio/360dialog to launch fast). 24h service window = free replies; proactive nudges need a paid pre-approved template. Meta business-verification + template approval is the slow part (process, not code). Costs are cents at this scale.
- **Claim your listing** portal — centres verify + edit their record, upload docs (availability/fees/programs PDFs). The WhatsApp agent *is* the low-friction claim channel.
- **Doc-ingesting chatbot** — bot answers parent questions from the centre's uploaded docs (replaces the email back-and-forth).
- **CRM-as-a-service** — every parent chat = a captured lead (intent, which centre, contact); pipeline + analytics centres don't get today.
- **Inquiry routing** — hand a qualified lead to the centre (email/SMS/webhook) and track outcome.
- **Sell to providers, not centres** — 16 mega-operators (0.15%) run ~22% of all centres; one HQ deal claims hundreds of listings at once, and their shared CMS makes enrichment cheap. Start there; leave the 5,643 single-site indies for self-serve claim.

## B2B product (directories — the buyer)

- **Embeddable chatbot widget** — drop-in script/iframe; theming to match the host site.
- **Data feed** — cleaned, enriched, daily-synced export (CSV/Parquet/API) under clear licensing.
- **REST API** — search + centre detail endpoints; keys + usage metering.
- **White-label** — host's branding on the widget and results.

## Platform / infra (when we leave PoC)

- **Neon (cloud Postgres)** for shared/demo environments.
- **Daily ACECQA sync** as a scheduled job (residential-IP box or official feed) + diff/alerting on big swings.
- **Auth + credits/metering** for the API tier.
- **Analytics** — funnel: searches → results shown → centre clicks → inquiries.

## Trust, legal, growth

- **AU trademark** for `kindello.com.au` (secure first-use).
- **Official ACECQA data agreement** — sustainable production feed + clean licensing.
- **G-NAF redistribution check** — read the "Open G-NAF Use Restriction" sheet before selling the feed.
- **SEO surface** — public per-centre / per-suburb pages for organic discovery (matches the scraper-saas-starter playbook).
- **Provenance / freshness page** — show buyers where data comes from and how fresh it is.

## Key discoveries (research log — 2026-06-18)

What we learned probing the data + competitors. These are the *why* behind the ideas above.

**Data we have vs don't**
- Have the full **authoritative spine** (18,229 centres / 10,738 providers): name, address, phone, hours, places, service type, **NQS rating (overall + 7 areas)**, lat/lng (92.7%).
- Have **no website, fees, vacancies, photos, or philosophy text** — none are in the ACECQA spine (confirmed against the raw CSV). All of it is enrichment.
- Source = **ACECQA Export-to-CSV** (curl, residential IP), *not* StartingBlocks (rejected on provenance).

**Competitor teardown (KindiCare + CareforKids, same centre — St Dunstans, Eastwood)**
- Both run on the **identical ACECQA spine** → we're at **total parity on facts**, incl. NQS (KindiCare just hides it in a modal).
- Both leave **philosophy/pedagogy blank** ("not provided" / generic auto-stub) → that column is **genuine white space**.
- Their fees are **enquire-gated / suburb-averaged**, not real → the data gap is monetised as **lead-gen**, not filled.
- KindiCare shows a **plain-English NQS explainer** — cheap UI win on data we already have.

**The differentiator = depth/pedagogy filtering**
- "Montessori near Carlton" **silently fails today** — `searchCentres` has no philosophy param, so the term is dropped (or worse, hallucinated).
- **No AU directory filters on pedagogy.** The moat is the *enriched dataset*, not the tech.
- **Free first layer exists now:** name-keyword match already yields **319 Montessori, 25 Steiner, 10 Reggio, 2,068 kinder, 828 community** — shippable with one `ILIKE`. High-precision, low-recall (catches self-branded centres, misses quiet practitioners → that's the gap scraping/embeddings fill later).

**pgvector, clarified**
- Enrichment ≠ "add description + index" — the hard part is **acquiring meaningful text per centre** (URL → scrape → clean); embed + index is the easy downstream half.
- pgvector indexes **vectors, not text** → needs a separate embedding model (Anthropic has none → Voyage/OpenAI). At 18k rows, likely **no index needed**; geo-pre-filter then exact-rank the survivors.

**Fees** — a **mandated, refreshed government source exists**: CCS session reports (fee reporting is a legal condition of subsidy under Family Assistance Law). StartingBlocks surfaces it but shows **no freshness date** → clean access = the **official data agreement**, not scraping. Dated fees = our edge.

**Vacancies** — **no authoritative source at all** (unlike fees); **the centre is the only source of truth**, and it decays fastest. This is *why* vacancies drive the supply-side flywheel rather than being a field to fetch.

**Images / licensing** — **display rights ≠ redistribution rights.** Google Places/scraped photos are display-only (TOS, attribution, ≤30-day cache); **only owner-uploaded photos can ship in the feed we sell.** PoC answer = **Street View Static** keyed on our lat/lng.

**Provider vs centre** — provider = legal operator, centre = physical service; **1 provider → many centres** (never many-to-many). 16 mega-operators run ~22% of centres → the wedge for both enrichment and B2B sales.

**Enrichment, two kinds** — **first-party** (centre-supplied: vacancies/fees/docs — fresh, clean, *the only fully sellable* data) vs **third-party/derived** (G-NAF/Places/CCS/scrape — bootstrap, each with a licensing/freshness asterisk). Product is always a hybrid; the **first-party share is the compounding moat**, and the WhatsApp agent is how you collect it without friction.

## PoC scope (NOW) — parent search only

The PoC proves one thing: **a parent types free text → gets the right centres in chat.** Everything else above is MVP. Build/keep only:

- [x] Parent chatbot: free text → `resolveLocation` + `searchCentres` over PostGIS, results as cards (built).
- [ ] **Cloud deploy** — Neon (Sydney) + Vercel; load data once (no daily sync — can't run on Vercel anyway, WAF blocks datacenter IPs). DB choice already decided ([[local-poc-then-cloud-for-demos]]).
- [ ] **Free pedagogy filter (the cheap standout)** — add a name-keyword/`ILIKE` filter (Montessori/Steiner/Reggio/kinder…) to `searchCentres` **and** `ingest/search.py` in parity, so "Montessori near Carlton" actually filters today. This is the one differentiator we can ship in the PoC with data we already have.
- [ ] **NQS plain-English explainer** on the card — hardcoded text per tier (Exceeding/Meeting/…) + the 7-area breakdown we already store. Presentation only, no enrichment.
- [ ] **Maps-link / Street View fallback** for display (no new data; uses lat/lng we have, name-based maps link for the ungeocoded tail).
- [ ] UI/UX polish in Claude-design style (in progress).

**Explicitly NOT in PoC:** fees, vacancies, photos (real), Places, scraping, pgvector, WhatsApp agent, claim portal, CRM, B2B API/widget, daily sync. All MVP.

---

_Add ideas under the nearest heading. When one's ready to commit, promote it into CLAUDE.md's Status/roadmap with a concrete next step._
