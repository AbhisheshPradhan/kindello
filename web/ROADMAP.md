# Childcare Directory — Build Roadmap

Build order, scoped so each phase is useful even at small scale and ships before the next begins.

> **Pivot DONE (2026-06):** AI chat search → traditional directory. The directory is now the
> live consumer product; the AI chat finder is parked at `/finder` (see "Pivot" section below,
> now settled). Project-wide framing is in the repo-root `CLAUDE.md`.

## Phase 1 — Directory core

- [x] Clean centre table keyed on **ACECQA service ID** (the spine; everything joins to it)
- [x] **Centre detail pages + suburb/care-type list+map UI** — server-rendered `/childcare/{suburb}/{postcode}`, `/{careType}/{suburb}/{postcode}`, `/centre/{id}`; Mapbox list+map, **radius-based** results (anchor on suburb centroid, ~5km, cap 50), **"Search this area" / "Zoom in to search" → "Map Area"** (deterministic `/api/directory-area`)
- [~] SEO foundation: `generateMetadata`, `robots.txt`, `sitemap.xml`, canonical URLs in place; **still to do:** Schema.org `LocalBusiness`/childcare JSON-LD, Core Web Vitals pass
- [~] Capacity signal from NQF approved-places data (shown on cards/detail; suburb-level SEO content still to write)
- [ ] Fuzzy-match each centre to a Google `place_id` with a confidence score; manual review for low-confidence matches (Tier-2 enrichment)
- [ ] Google Places as a **live display layer** (ratings, photos, hours, popular times) — respect ToS, attribute, don't warehouse what you can't store (Tier-2 enrichment)

## Phase 2 — Parent workflow

- [ ] Shortlist
- [ ] Route/commute-based discovery (home / work / gym → centres along the route). Most distinctive feature — build it well: real drive/transit time, direction-aware, shows detour cost
- [ ] Enquire flow with "enquire to check availability" framing
- [ ] Capture enquiry responses as structured, timestamped **first-party vacancy signal**

## Phase 3 — Centre side (the actual product)

- [ ] Page claiming
- [ ] Vacancy/price display with a visible **"last updated" freshness timestamp** (cheap, high-trust — do early)
- [ ] Embeddable widget / API so centres power their own site from the same data (day-one value; gets centres in without needing your traffic)

## Phase 4 — WhatsApp agent

- [ ] WhatsApp/SMS → structured vacancy/price parse
- [ ] **Parse-and-confirm loop** ("Got it: Toddlers, Fri, $153 — reply Y"); never write to DB unconfirmed
- [ ] Audit log on every change
- [ ] Keep strictly scoped to vacancy/price — no FAQ/general-enquiry bot

## Phase 5 — Retention / later

- [ ] Waitlist management (sticky, but heavier build + personal-data obligations — not v1)
- [ ] Data API for third parties (potential big play; only once coverage/freshness is real)

## Keep throughout

- Confirmation before any vacancy write (a wrong "no vacancies" can cost a parent a spot)
- Honest staleness signals everywhere vacancy is shown
- Ship Phase 1 tight and done before sprawling

---

## URL & page model — LOCKED (Phase 1)

Classic directory, mirrors CareforKids. `childcare` (one word) everywhere except the
proper-noun "Child Care Subsidy". Postcode disambiguates duplicate suburb names (no state
in the URL). Only **care-type + location** are indexable; every other filter is a query
param that is `noindex` + canonical → base page.

| Page | URL | Renders |
| --- | --- | --- |
| Home | `/` | Location search hero + browse sections (SEO internal links) |
| State hub | `/childcare/nsw` | Landing: intro + browse links to suburbs/regions + top centres. **No map/list.** |
| Suburb (all care) | `/childcare/auburn/2144` | **Listings + map** (list-primary) + suburb stats + intro + nearby/other-type links |
| Care type × suburb | `/long-day-care/eastwood/2122`, `/oshc/...`, `/preschool/...`, `/family-day-care/...` | Same as suburb, filtered to type |
| Centre | `/centre/SE-00009523` | Detail page |
| Refinements | `…?rating=exceeding&openLate=1&page=2` | Query params — `noindex`, canonical → base |

- **Slugs:** lowercase, multi-word suburbs hyphenated (`surry-hills`); care types
  `long-day-care` / `preschool` / `oshc` / `family-day-care`.
- **Rendering:** ISR (render-on-first-hit + cache, revalidate on daily sync); pre-build
  only the top suburbs. ~13.5k pages total (4.5k suburbs + ~9k type×suburb).
- **Thin suburbs:** generate a page for any suburb with ≥1 centre; show exactly what's there
  + suburb stats + nearby-suburb links. No padding with other suburbs, no merging. Honest.
- **Layout:** list-primary — full paginated list is the hero, map is a supporting panel
  (side-by-side desktop, toggle mobile).

## Pivot to classic directory — SETTLED (2026-06)

- [x] `explore/finder-hybrid-search` merged → `main` (search-core + map + atoms = the foundation).
- [x] **AI chat is parked, not deleted:** lives at `/finder`; not linked from the main flow.
- [x] **Homepage hero = `DirectorySearchHero`** (traditional location search → routes to the
  suburb landing URL). The AI `ChatSearchHero` / chat-view is preserved for later experiments
  and the future embeddable widget.
- [x] Suburb/type pages reuse `lib/search-core` / `lib/directory` + `RatingTag` +
  `CentreListCard` + the shared Mapbox map; `/api/search` and `/api/directory-area` power the
  deterministic (no-token) query path.
- [x] Suburb pages are **radius-based by default** (not strict suburb match) and support
  **"Search this area" → "Map Area"** re-query; see repo-root `CLAUDE.md` Status for detail.
