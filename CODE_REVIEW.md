# Code review — directory pivot (2026-06-20)

Reviewer: senior eng pass over the AI-chat → traditional-directory pivot (commits `4d72023..89427c6`) plus the uncommitted `ingest/crawl` work. Typecheck is clean (`tsc --noEmit` → 0). The architecture is sound and the client/server split is disciplined. The findings below are ordered by severity. The AI-chat (`/finder`, `/chat`, `/api/chat`) and dark-mode plumbing are intentionally retained for the future Next.js template and are **excluded** from the "dead code" findings.

---

## Critical (address before public launch)

### C1. Fabricated reviews and star ratings are presented as real
- `web/app/centre/[id]/[[...slug]]/page.tsx:114-136` renders invented parent reviews with invented author names ("Priya M.", "Tom R.") and quote bodies on **every** centre detail page.
- `web/lib/directory.ts:92-110` derives a Google-style star score + review count from the NQS tier, shown as `StarRating value count` on the detail header, the list cards (`centre-list-card.tsx:67`), and nearby cards — with **no disclaimer** at the point of display.
- The only honesty caveat is buried in the reviews section subhead (`page.tsx:560-563`).

Why this matters: representative *star numbers* anchored to NQS is a defensible grey area; **fabricated named testimonials with specific praise quotes** published on a live consumer site is a materially different misrepresentation risk (ACCC/consumer-trust, and it will block any future AggregateRating structured data under Google's policy). CLAUDE.md's honesty rule and the "no em dashes / honesty-bound copy" posture point the same way.

Recommendation: before launch, remove the fabricated review *text/authors* (replace with an honest empty-state: "Verified reviews coming soon"), and either drop the star score from cards or label it clearly as an NQS-derived indicator, not a review score. Keep the deterministic seed plumbing so real Places data drops straight in.

### C2. Public URLs leak the raw ACECQA approval number — and the documented internal-id scheme does not exist
- CLAUDE.md states as a hard rule: detail URLs = `/childcare/{code}/{slug}` where `{code}` = **base36 of an internal `services.id BIGINT GENERATED ALWAYS AS IDENTITY`**, and "Do NOT put the raw ACECQA number in public URLs (leaks the regulator's scheme; breaks if re-issued)."
- Reality: `ingest/schema.sql:33` — the `services` PRIMARY KEY is `service_approval_number text` (e.g. `SE-00009695`). There is **no `id` identity column**. `grep` finds no base36 helper anywhere in `web/`.
- `web/lib/directory.ts:131` sets `id: row.service_approval_number`, and `web/lib/slugs.ts:centrePath` emits `/centre/{id}/{slug}` → live URLs are `/centre/SE-00009695/...`.

So the "Internal ids (built)" status line in CLAUDE.md is **inaccurate** — the work was never done — and the shipped URL scheme is exactly the one the rule forbids. This is hard to reverse after launch (URLs get indexed/linked).

Recommendation: decide deliberately now. Either (a) add the identity column + base36 codec and switch `centrePath`/routes to `/childcare/{code}/{slug}` before indexing, or (b) consciously accept `service_approval_number` as the permanent public key and **update CLAUDE.md** so the rule matches reality. Do not ship indexable URLs against an undecided scheme. Note also the route folder is `/centre/...` while the documented prefix is `/childcare/...`.

---

## High

### H1. Radius-blended suburb pages — RESOLVED (accepted, with a differentiation mitigation)
`getSuburbPage` anchors on the suburb centroid and radius-searches `SUBURB_RADIUS_KM = 5` (`web/lib/directory.ts:609,640-659`), so adjacent suburbs (Marsfield/Eastwood/Epping) return a largely overlapping centre set.

**Decision (2026-06-20):** the radius blend stays — it matches KindiCare/Toddle/CareForKids and reflects real catchment behaviour. Shared *listings* across neighbouring pages are not a duplicate-content problem; Google does not penalise two local pages for surfacing some of the same businesses.

The residual risk is page-level near-duplication: the only thing that must hold is that each page is differentiated on its own content (unique H1, intro, stats), so Google sees distinct local pages rather than one canonical + filtered duplicates. We already differentiate the H1, intro sentence, and stat chips per suburb (`suburb-directory.tsx:44-59`). The mitigation is to make that intro **substantive and data-grounded** rather than a name-swap (see below) — that is the line between "competitor-grade local page" and "templated doorway" under Helpful Content.

**Mitigation — data-composed suburb intro (no fabrication, no LLM-per-page):** compose 2–4 sentences deterministically from facts we already hold, so every suburb's copy is genuinely distinct and 100% true:
- in-suburb count vs surrounding catchment ("8 centres in {suburb} itself, plus 42 within 5 km")
- NQS distribution ("6 rated Exceeding NQS or above")
- care-type coverage from `stats.byCare` ("strong on long day care; only 2 OSHC services")
- named nearby suburbs the catchment draws from (already fetched via `getNearbySuburbs`)
- (optional, +1 query) the largest providers/brands present

Avoid ungrounded "lifestyle" prose (population, "leafy family suburb") — we don't hold that data and it invites hallucination + the spun-content penalty. Implementation sketch lives with the H1 follow-up; slots into `getSuburbPage` (expose strict in-suburb count) and replaces the inline `introSuburb` string in `suburb-directory.tsx`.

Still open: confirm whether to gate the sitemap (`app/sitemap.ts`) to suburbs above a minimum centre count, so we don't ship thin 1–2 centre pages to Google.

### H2. No structured data despite launch-phase SEO mandate
CLAUDE.md flipped technical SEO + JSON-LD into scope for launch, but `grep` finds **zero** `application/ld+json` in the app. The detail page already has everything needed for `LocalBusiness`/`ChildCare` + `FAQPage` (the FAQ block at `page.tsx:589-612`) + `BreadcrumbList`. This is a high-ROI, low-effort gap.
Caveat tied to C1: do **not** emit `AggregateRating`/`Review` schema while the review data is fabricated — that compounds C1 into a Google policy violation. Ship LocalBusiness + FAQPage + Breadcrumb now; add rating schema when Places data is real.

---

## Medium

### M1. Two parallel search systems with divergent taxonomies and catchments
- `/search` (`app/search/page.tsx`, the "Browse" nav target) uses `searchDirectory` with a **12 km** radius (`directory.ts:423`) and care-type values `long_day_care`/`oshc` (underscores, OSHC combined) — see `components/search/search-filters.tsx:9` and `CARE_PREDICATES` (`directory.ts:172`).
- Suburb pages use `getSuburbPage`/`getAreaCentres` with a **5 km** radius and care-type *slugs* `long-day-care`/`before-school-care`/… (OSHC split) — `CARE_TYPES` (`directory.ts:481`).

Two taxonomies, two radii, two code paths, both live and indexable. This is real maintenance debt and a source of inconsistent results. Recommend consolidating on the slug taxonomy + one radius constant, and deciding whether `/search` is still needed now that suburb pages are the primary surface (it's allowed by robots but absent from the sitemap, so it's a half-citizen).

### M2. `getSuburbPage` runs twice per request (metadata + body)
Both `generateMetadata` and the page component call `getSuburbPage` (`childcare/.../page.tsx:17` and `:38`; same in `[careType]/...`), each firing the anchor query + a `getAreaCentres` radius query. ISR (daily) masks this, but uncached renders do ~2× the DB work for free. Wrap the fetch in React `cache()` (no `cache()` usage exists anywhere yet) so metadata and body share one execution.

### M3. Filter changes silently discard "Map Area" mode
In `suburb-results.tsx` the area state lives in the client island, but the `ResultsToolbar` care-type/rating pills call `router.push` (`results-toolbar.tsx:103-109,218-232`), which navigates server-side and remounts the island — so adjusting a filter while viewing "Map Area" throws the user back to the suburb view with no indication. Either disable/hide the filter pills in area mode, or carry the area filter through the client search instead of a nav.

### M4. Duplicated area-prompt / zoom-in logic
The `awaitingZoomInSearch` ref + `zoomInTick` + `onRegionChange` handler block is copy-pasted between `suburb-results.tsx:99-130,310-321` and `finder/results-canvas.tsx`. Since a template is the explicit end goal, extract a `useAreaSearch()` hook (or shared component) so the two consumers can't drift. Low risk, high template payoff.

---

## Low / housekeeping

- **L1. Debug scripts committed.** `ingest/crawl/debug.js`, `debug2.js`, `discover-test.js` look like scratch files checked into the tree. Remove or move under a gitignored scratch dir. (The `crawl.js` rewrite + `enrich_crawl.py` deletion are legit Stage-4 enrichment WIP, just unrelated to the directory pivot and still uncommitted.)
- **L2. Capped stats vs headline.** `getAreaCentres` computes stats over the capped 50-row set (`directory.ts:741-746`) — intentional and documented, but "{n} approved places" / "Exceeding+" reflect only the shown 50. Fine; just keep the copy honest if the cap ever rises.
- **L3. Accessibility.** The custom care-type dropdown (`directory-search-hero.tsx`) and both location autocompletes use `role=listbox/option` but have **no keyboard navigation** (arrow keys / `aria-activedescendant`) — keyboard users can't move through suggestions. Also `MapPreview` sets `aria-hidden` when there are 0 points even though the map stays interactive (`map-preview.tsx:120`).
- **L4. `/api/directory-area` is an unauthenticated public POST** that runs a PostGIS query per call. Radius is clamped (1–30 km) so blast radius is small, but there's no rate limit — fine for launch scale, worth noting.
- **L5. `titleCase` cosmetics** (`directory.ts:162`): `McDonald → Mcdonald`, `O'Brien → O'brien`. Acceptable for now; flag if names look off in QA.

---

## What's good
- Clean server/client boundary: `suburb-directory.tsx` (server shell) vs `suburb-results.tsx` (client island) importing `lib/directory` as `import type` only, keeping `pg` out of the client bundle. This is exactly right.
- `getAreaCentres` as the single source for both the default suburb catchment and "Search this area" — one query, so the header count == list length (no chip/list mismatch). Good call.
- The shared `MapboxMap` with Finder behaviour gated behind `interactive`/`onRegionChange`/`zoomInTick` props matches the "one map, varied by props" rule. Marker swap without map teardown avoids flicker.
- ISR (`revalidate = 86400`) aligned to the daily ACECQA sync; `notFound()` on empty suburbs prevents empty doorway pages; sitemap only emits care-type pages that actually exist.

## Open questions for the team
1. C2: base36 internal id, or accept `service_approval_number` as the public key and fix the docs? (Blocking for URL stability.)
2. H1: what's the intended canonical/indexation strategy for radius-overlapping suburb pages?
3. M1: is `/search` staying, or are suburb/care-type pages the sole directory surface?
