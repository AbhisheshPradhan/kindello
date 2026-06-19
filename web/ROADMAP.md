# Childcare Directory — Build Roadmap

Build order, scoped so each phase is useful even at small scale and ships before the next begins.

## Phase 1 — Directory core

- [ ] Clean, deduped centre table keyed on **ACECQA service ID** (foundation everything joins to)
- [ ] Fuzzy-match each centre to a Google `place_id` with a confidence score; manual review for low-confidence matches
- [ ] Google Places as a **live display layer** (ratings, photos, hours, popular times) — respect ToS, attribute, don't warehouse what you can't store
- [ ] Centre detail pages + map/list UI
- [ ] SEO foundation: structured data (Schema.org `LocalBusiness`/childcare), clean IA, fast Core Web Vitals, mobile-friendly
- [ ] Capacity-based scarcity from NQF approved-places data (free; powers suburb-level SEO content)

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

## Pivot to classic directory — decisions (in progress)

- Merge `explore/finder-hybrid-search` → `main` (search-core + map + atoms = the foundation).
- **AI chat is parked, not deleted:** stays at `/finder`; not linked from the main flow.
- **Homepage hero is two swappable components:** `DirectorySearchHero` (new, traditional
  location search → routes to the suburb landing URL) and `ChatSearchHero` (the existing AI
  chat hero, preserved for later experiments). Homepage renders the directory one.
- Suburb/type pages reuse `lib/search-core` + `RatingTag` + `PlaceResultCard` + the map;
  `/api/search` powers the client-side query-param refinements.
