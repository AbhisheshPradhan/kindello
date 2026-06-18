# Spec — Chat & Refine experience (search-state + criteria chip bar)

**Status:** DRAFT for discussion. Nothing here is built yet. Owner: chat/refine. Last edited 2026-06-19.

**Scope:** the conversational _find + narrow_ loop only — the model, the tools it calls,
the result set, and the controls a parent uses to refine. **Out of scope** (deliberately
parked, do not design here): bookmarking, saved-centres map, side-by-side comparison,
multi-anchor "near home + work" commute search, and the Tier-2 enrichment that would add
fees/vacancies/philosophy data. We assume the spine data we have today.

---

## 1. Thesis & the problem we're solving

Parents are **not auditing the market** — they want a short, trustworthy shortlist and a
fast way to narrow it. That's the one reason to use a chatbot instead of the competitor's
filter sidebar (KindiCare / CareforKids), which dumps everything. If we also dump
everything, we've rebuilt the directory and lost the differentiator.

But **pure chat loses to a good filter sidebar on control and visibility**: a sidebar shows
your active filters and lets you remove any one instantly; our chat hides the accumulated
criteria inside the model's head, and every refine is a lossy LLM round-trip that can
silently drop or mis-set a filter (we've already hit this class of bug in `resolveLocation`).

**Conclusion: the winning shape is neither pure chat nor pure filters — it's chat that
drives a visible, directly-editable criteria state.** This spec is mostly about making the
narrowing _visible, steerable, and childcare-aware_. That hybrid is genuinely better than
the directories; chat-only is just _different_.

---

## 2. Where we are today (ground truth)

**Tools** (`web/lib/tools.ts`):

- `resolveLocation(text)` → `{lat,lng,label,kind,n}` (suburb/postcode → centroid of our own
  geocoded rows; biggest-cluster disambiguation).
- `searchCentres({latitude, longitude, radius_km=5, care_type?, min_rating?, keyword?,
variants?, limit=10, exclude_ids?})` → array of centre rows ordered by `match_score DESC,
distance, service_approval_number`. `exclude_ids` (just shipped) powers "show more".
- `suggestFollowUps({questions[]})` → renders tappable chips.

**Prompt** (`web/app/api/chat/route.ts`): search-first, cards-not-prose, honesty rules,
"showing more" rule, taper-the-follow-ups guidance.

**UI** (`web/components/home/chat-view.tsx`), layout from top to bottom:

- **Sticky tabs bar** (`ConversationTabs`: Answer | Places(count) | New search) at `top-13.75`.
- **Answer tab**: transcript of `AnswerTurn`s (each = "Answer · ACECQA · synced today"
  header → `MapPreview` with floating cards + pins → key-fact chips + 1–2 sentence answer),
  then `FollowUps` chips after the last turn, then a **sticky floating composer** at the bottom.
- **Places tab**: a grid of `PlaceResultCard`.
- The model returns the best 3–5 (or an explicit count); all three surfaces (cards, pins,
  Places) now show that same set.

**Design system:** reuse `web/components/ds/*` (`Tag`, `Button`, `RatingBadge`, `FollowUps`,
`ConversationTabs`, …) + `web/components/ui/*` primitives. New UI composes these; no inline
styles bar runtime-dynamic values.

### 2.1 Data reality — what we can actually narrow on

| Dimension                                | Source                      | Filter?                      | Notes                                                           |
| ---------------------------------------- | --------------------------- | ---------------------------- | --------------------------------------------------------------- |
| Location                                 | geocoded spine              | **required**                 | ask before search only if missing                               |
| Care type (LDC / preschool / OSHC / FDC) | flag columns                | **yes**                      | usually _inferable_ from the query — don't ask                  |
| NQS rating                               | spine                       | **yes**                      | the one real quality signal; but 68% = "Meeting", weak per-row  |
| Radius                                   | geog                        | **yes**                      | the main loosen/tighten lever                                   |
| Centre size                              | `number_of_approved_places` | **yes (cheap, unbuilt)**     | small <40 / med / large 80+                                     |
| Open early / late                        | `operating_hours` JSONB     | **partial (cheap, unbuilt)** | register hours don't cleanly split OSHC AM/PM — caveat          |
| Philosophy / program                     | `service_name` only         | **rank-only**                | name-string match; not a true filter; no philosophy data        |
| Fees / out-of-pocket                     | —                           | **no**                       | not held; never imply                                           |
| Live vacancy / waitlist                  | —                           | **no**                       | not held; the #1 real-world blocker — capture intent, be honest |
| Age / room                               | —                           | **no (infer)**               | map age → care_type; room-level not held                        |

The narrowing menu is **~3 strong levers (care_type, NQS, radius)** + 2 cheap ones (size,
hours). Everything else is intent we capture but cannot filter on.

---

## 3. Goals / non-goals / success

**Goals**

1. Make the accumulated criteria **visible and directly editable** (the hybrid).
2. Make refine **reliable** — a filter never silently drops; state is deterministic.
3. Support **loosen as well as tighten**, and **widen on thin/empty** results.
4. Keep every turn **result-bearing** — never reply with questions alone.
5. Be **childcare-aware**: capture age/days/start-date/vacancy intent and frame honestly.

**Non-goals (this phase):** bookmarking, comparison, commute/multi-anchor, real
vacancy/fees, pgvector philosophy search. (All noted in §10 for later.)

**Success metrics** (how we'll judge "better than manual filtering"):

- Median **turns-to-shortlist** (first prompt → a ≤5-centre set the user stops refining on).
- **Zero-result rate** per refine (target: near-zero, because widen is automatic).
- **Follow-up / chip click-through** (are the offered refinements the right ones?).
- **Drop-off** before first result (should beat a sidebar — no pre-result form).
- Qualitative: can a non-expert parent reach a confident shortlist without knowing the
  filter vocabulary?

---

## 4. Core architecture — one canonical SearchState, two write paths

Today the model re-derives all filters from the conversation every turn (fragile). **Flip
it: the client owns a canonical `SearchState`; the model proposes _deltas_; chip edits apply
_deltas_ directly without the LLM.** Both paths converge on one deterministic query function.

```
                      ┌─────────────────────────────┐
   user types  ─────► │  POST /api/chat              │  (LLM in the loop)
   ("open till 6")    │  body: messages + searchState│
                      │  model returns searchCentres │
                      │  args  ──► becomes new state  │
                      └──────────────┬──────────────┘
                                     │
   chip edit / slider ───────────────┤  (NO LLM, deterministic, fast, free)
   ("remove NQS", radius=10)         │  POST /api/search  body: searchState
                                     ▼
                          runSearch(state)  ◄── single shared server fn
                          (the searchCentres SQL, extracted to lib)
                                     │
                                     ▼
                          rows + facet counts ──► update results + chip bar
```

**Key points**

- **Extract the search SQL** out of the `searchCentres` tool into a shared
  `runSearch(state): { rows, facets }` in `web/lib/search-core.ts`. Both the `/api/chat`
  tool and a new **`/api/search`** route call it. (`resolveLocation` similarly shared.)
- **`/api/search`** is the deterministic path for chip/slider edits: no model, no streaming,
  no token cost, no lossiness. Returns rows + facet counts. The client renders them as a
  new results block with a short synthetic note ("Filtered to Exceeding NQS · 3 within 5km")
  instead of model prose.
- **`/api/chat`** still owns natural-language turns. The route receives the current
  `searchState`, puts it in the system context ("current filters: …"), and the model's
  `searchCentres` tool-call args **are merged into** the client's `searchState` mirror when
  results come back. So chat edits and chip edits stay in sync in one place.
- The model is told: for refinements that map cleanly to a known lever, it may still call
  `searchCentres`; the _visible_ state is always the chip bar, so the user can see/undo
  whatever the model did. This is the safety net over LLM unreliability.

### 4.1 `SearchState` shape (client-owned, persisted in sessionStorage with the thread)

```ts
type SearchState = {
	location: { label: string; lat: number; lng: number } | null; // required to search
	careType: "long_day_care" | "preschool" | "oshc" | "family_day_care" | null;
	minRating: NqsRating | null;
	radiusKm: number; // default 5
	size: "small" | "medium" | "large" | null; // P2
	openBefore: string | null; // "07:30" — P2, caveated
	openAfter: string | null; // "18:00" — P2, caveated
	keyword: string | null; // philosophy/name term (rank-only)
	sort: "distance" | "rating" | "size"; // P2, default "distance"
	limit: number; // default 5
	excludeIds: string[]; // pagination ("show more")
	// captured-but-unfilterable intent (P3, seeds CRM; never fabricated into filters):
	intent: { childAge?: string; daysNeeded?: string; startDate?: string };
};
```

A pure reducer `applyDelta(state, delta): SearchState` is the single mutation point. Removing
a chip = delta setting that field to null/default; changing radius = delta with `radiusKm`.

---

## 5. UI — where the criteria chip bar lives (matched to the current layout)

**Placement: a persistent `CriteriaBar` directly under the sticky tabs bar, inside the same
sticky container, shared by BOTH tabs.** This is exactly where a sidebar shows "applied
filters", and it stays visible as the transcript scrolls.

```
┌───────────────────────────────────────────────────────────┐
│  [ Answer ]  [ Places · 5 ]            [ + New search ]      │  ← ConversationTabs (sticky, exists)
├───────────────────────────────────────────────────────────┤
│  Parramatta ✕   OSHC ✕   ≥ Meeting ▾   ◉ 5 km ▾   Sort ▾   │  ← CriteriaBar (NEW, sticky, shared)
├───────────────────────────────────────────────────────────┤
│  12 nearby · 3 Exceeding · 4 open past 6pm                  │  ← facet line (P2, optional)
│                                                             │
│   …Answer transcript / Places grid…                        │
│                                                             │
│                          [ floating composer ]              │  ← sticky (exists)
└───────────────────────────────────────────────────────────┘
```

**Concretely in `chat-view.tsx`:** the sticky wrapper at line ~592 currently holds only
`<ConversationTabs/>`. Add `<CriteriaBar/>` as a second row inside that same
`sticky top-13.75 … bg-background` container so both pin together. It renders in Answer and
Places identically (it describes the current result set, which both tabs share).

**`CriteriaBar` component** (new DS component `web/components/ds/criteria-bar.tsx`, composed
from existing `Tag` + a small popover from `components/ui/*`):

- **Location chip** — removable only by "New search" (it's required); tapping it focuses the
  composer to retype.
- **Removable value chips** — care type, NQS, size, keyword. `✕` dispatches a remove delta →
  `/api/search` → results refresh. Reuses `Tag` styling.
- **Adjustable chips with a popover (`▾`)** — radius (slider 1–25km), NQS (tier picker),
  sort. Changing → delta → `/api/search`.
- **Empty state** — before any search, the bar is hidden; it appears with the first result.
- **Mobile** — horizontally scrollable chip row (same pattern as the mobile floating-card
  carousel already in `AnswerTurn`); popovers become bottom sheets.

**Facet line** (P2) — a thin muted line under the bar showing counts for the _current_
location/radius so narrowing is informed _before_ a click ("3 Exceeding"). Source: `facets`
from `runSearch`.

**Thin/empty results** — when a refine returns 0–1, the bar surfaces an inline **"widen"**
affordance ("Only 1 within 5km — widen to 10km, or include Meeting NQS?") wired to one-tap
loosen deltas. We never end on a bare empty screen.

**Relationship to `FollowUps`:** `FollowUps` (model-suggested _next_ narrowing questions)
stays where it is, above the composer. The `CriteriaBar` is the _current_ state; `FollowUps`
is the _suggested next step_. They're complementary: chips = what's applied + manual undo;
follow-ups = guided next narrowing. A follow-up click can either go through the model
(natural language) or, when it maps to a known lever, apply a delta directly.

---

## 6. The refine loop (behavioural rules)

1. **Results after every turn** — never reply with questions alone. Search with what we have,
   show the best 3–5, then offer 2–3 refinements. Only ever ask _before_ results for a
   required missing field (location).
2. **One datapoint per refinement** — each chip/follow-up adds (or removes) one constraint
   and re-runs. Conversational faceting is one facet at a time.
3. **Loosen, not just tighten** — chips are removable; thin results auto-suggest widen.
4. **Infer before asking** — "after-school care for a 6yo" already gives `careType=oshc` +
   school-age; never re-ask known info.
5. **Taper & stop** — follow-ups get fewer/more specific as the set narrows and stop when the
   set is already small and good. Stop condition = a confident ≤5 set, NOT a fully-populated
   state object. We do **not** chase a value for every column.

---

## 7. Childcare-aware intent capture (P3 — also seeds the CRM)

NQS + distance isn't how parents actually choose. Capture (don't fabricate) the real
decision factors even though we can't filter on them:

- **Vacancy + start date + days needed** — the #1 blocker. Ask "When do you need a place, and
  how many days?" → answer honestly ("I can't see live vacancies; want me to note these to
  contact?") and store in `intent` (CRM lead per the parked product idea).
- **Age → care type** — capture age, map to `careType`; don't ask care type directly.
- These are stored in `SearchState.intent` and shown as _neutral_ context chips (not filters)
  so it's clear they inform framing, not the query.

---

## 8. Trust & NQS literacy (P3, cheap, high-leverage)

- **Explain the ranking** — "closest Exceeding-rated OSHC open till 6" beats a silent black
  box for a high-stakes choice. We already have the data to say _why_ each centre made the cut.
- **NQS education inline** — 68% are "Meeting NQS"; most parents don't know that's the
  benchmark, not a warning. The chat can teach this where a checkbox can't ("Most centres sit
  at Meeting NQS — that's the standard. Want only the rarer Exceeding ones?").

---

## 9. Phased delivery

- **P1 — Hybrid core (the spec's spine).** `SearchState` + reducer; extract
  `runSearch`/`resolveLocation` to `lib/search-core.ts`; `/api/search` deterministic route;
  `CriteriaBar` under the tabs (location/care/NQS/radius, remove + radius popover);
  loosen-on-thin widen affordance; sessionStorage persistence. Prompt: pass state in, accept
  deltas.
- **P2 — Informed narrowing.** Facet counts line; sort control; cheap filters (size from
  `approved_places`, open-early/late from `operating_hours` with caveat).
- **P3 — Childcare brain.** Intent capture (age/days/start/vacancy) + honest framing + CRM
  seed; NQS literacy + rank-reason copy.

Each phase is independently shippable and testable; P1 alone makes us beat the sidebar.

---

## 10. Out of scope / later (noted so we don't design them here)

Bookmarking + saved-centres map; side-by-side comparison; multi-anchor commute search;
real vacancy/fees/philosophy enrichment (Tier-2); pgvector semantic "vibe" search.

---

## 11. Open questions (for our discussion)

1. **Do chip edits go through the model or hit `/api/search` directly?** I propose **direct**
   (fast, free, deterministic, no lossiness) with a synthetic note instead of prose. Agree,
   or do you want every refine narrated by the model for consistency?
2. **How much P3 intent capture in v1?** It's the most _childcare-expert_ part and seeds the
   CRM, but it asks questions we can't filter on. Pull some of it into P1, or hold until the
   hybrid core proves out?
3. **Facet counts** cost an extra aggregate query per search. Worth it in P2, or only compute
   on demand (when the bar is interacted with)?
4. **CriteriaBar vs FollowUps overlap** — keep both (state vs suggestion), or fold suggested
   refinements into the bar as "+ add filter" affordances?
5. **Where does `New search` reset to** — clear all state incl. location, or keep location and
   clear filters? (I lean: clear everything, matching today's "refresh = new chat".)

```

```
