# Kindello — Design System

> **Kindello** is an AI-powered childcare directory for Australia: a database of every approved childcare / early-childhood-education service in the country, plus a plain-English AI finder that helps parents find the right centre. It's monetised B2B — a cleaned, daily-synced **data feed + embeddable chatbot widget + API** sold to childcare directories.

This design system captures Kindello's brand and turns it into reusable tokens, components and full-screen UI kits so any agent can produce on-brand interfaces, mockups, and prototypes.

**Voice & feel:** warm and trustworthy with a playful edge — reassuring to parents, never clinical or corporate. Teal-led, plenty of whitespace, friendly rounded corners.

---

## Sources

Built from the product's own codebase. Explore these to go deeper:

- **GitHub — `AbhisheshPradhan/kindello`** (`main`): https://github.com/AbhisheshPradhan/kindello
  - `web/app/globals.css` — the canonical token set (oklch, teal `#1CA6A6`, radius `0.75rem`, light/dark).
  - `web/components/centre-card.tsx` — the listing-card pattern + NQS rating colour map.
  - `web/components/ui/*` — shadcn/ui (new-york, stone base) on Tailwind v4 + prompt-kit chat components.
  - `web/app/page.tsx` — the hero search / chat UI.
  - `CLAUDE.md` / `README.md` — full product, data-model and architecture context.

The current shipped product is the **AI chatbot finder**; the homepage, results grid and centre-detail page in this system's UI kit are an on-brand *extension* of that foundation (the directory surfaces the product is growing into), grounded in the codebase's real tokens and components.

> ⚠️ **Brand extensions, flagged for review:** the codebase ships **teal only** (its `--accent` is a soft teal tint). The **coral `#F9603F`** and **sunny-yellow `#FFC83D`** accents here were introduced to satisfy the directory brief ("soft coral or sunny-yellow accent"). They are harmonised with the teal but are *not* yet in the product. Confirm or adjust before treating them as canonical.

---

## CONTENT FUNDAMENTALS

How Kindello writes.

- **Voice:** plain, warm, reassuring. Talks *to* the parent. Uses **"you" / "we"** ("Ask in plain English — **we'll** search…", "Find childcare near **you**"). Never bureaucratic.
- **Casing:** **Sentence case everywhere** — headings, buttons, nav. ("Find the right childcare, faster.", "Popular near you", "Browse by type"). Not Title Case. Section eyebrows are the one exception (UPPERCASE, tracked).
- **Headlines:** short, benefit-led, often with a period for warmth and calm. "Find the right childcare, faster." "Find approved childcare, anywhere in Australia."
- **Numbers as trust signals:** concrete, specific figures build authority — "18,229 approved centres", "updated daily", "★ 4.8 · 126 reviews", "66 approved places". Lean on real ACECQA data, not vague claims.
- **Domain language (Australian, precise):** *long day care, family day care, preschool/kindergarten, occasional care, NQS rating, Exceeding / Meeting / Working towards, Child Care Subsidy (CCS), approved places, vacancies, ACECQA*. Spelling is **Australian** (centre, programme→program, paediatric).
- **Tone of microcopy:** helpful and low-pressure. "Places available", "Waitlist only", "Verified · synced today". CTAs are direct verbs: "Enquire", "Find care", "View details", "Save".
- **Emoji:** **none** in product UI. Warmth comes from colour, roundness and imagery — not emoji.
- **Examples of good copy:**
  - Placeholder: *"Tell us what you're looking for — e.g. Montessori daycare in Surry Hills with outdoor space."*
  - Chips: *"Long day care near me" · "Open weekends" · "Highly rated in Inner West"*
  - Reassurance line: *"Quality ratings sourced from ACECQA."*

---

## VISUAL FOUNDATIONS

- **Colour:** teal `#1CA6A6` is the brand anchor — logo mark, primary buttons, links, focus rings, "Exceeding" ratings. Warm off-white page (`oklch(0.99 0.005 95)` ≈ `#FDFCFA`), white cards. Coral `#F9603F` is the **single high-intent accent** (Enquire, "Places available"); sunny-yellow `#FFC83D` is reserved for **star ratings** and small highlights. Warm stone neutrals for text/borders. NQS ratings have a fixed semantic ramp (teal → blue → amber → red → grey). Use **one or two tints per page** as soft section bands (`--teal-tint`, `--sun-tint`), never hard dividers.
- **Type:** **Geist** (sans) for everything, **Geist Mono** for data/stats (rating numbers, prices, capacity). Headings are semibold (600) with tight tracking (`-0.02em`); body is regular at 1.5–1.65 line-height. Generous scale — hero up to ~52px. `text-wrap: balance` on headings, `pretty` on body.
- **Spacing & layout:** 4px base grid. Centred max-width content (`1200px` directory / `760px` hero & prose). Sections breathe with ~64–80px vertical rhythm. Generous whitespace is a brand value.
- **Corners:** friendly and rounded. `12px` base for cards, `16–24px` for large panels/modals, **fully rounded pills** for chips, tags, the hero input and round icon buttons. Nothing sharp.
- **Cards:** white fill, `1px` hairline border (`--border`), soft `shadow-sm`, `radius-xl`. On hover they **lift** (`translateY(-2px)`), deepen to `shadow-md`, and the border tints teal. This is the signature interaction.
- **Shadows:** soft, warm, low-contrast (tinted near-black, never pure black). Layered: cards `shadow-sm`, hover `shadow-md`, the hero composer `shadow-lg`. Brand "glow" shadows (`--shadow-teal`, `--shadow-coral`) sit under primary/accent CTAs only.
- **Backgrounds:** mostly flat warm off-white. **One subtle gradient** is on-brand: the hero fades from `--teal-tint` to the page colour. No heavy gradients, no purple, no noise/texture, no photographic hero. Section separation is by tint band, not lines.
- **Imagery:** centre photos are warm (teal / coral / sunny gradient placeholders in this system — replace with real photography). Always paired with a **Verified** badge and a save/heart affordance in the corners.
- **Animation:** restrained and quick (`.15–.18s ease`). Card lift on hover, chip tint on hover, chevron rotate on FAQ open. The chatbot has a typewriter placeholder cycling AU suburbs. No bounces, no infinite loops, respects reduced-motion.
- **Hover / press:** primary buttons darken (`teal-500 → teal-600`), accent (`coral-500 → coral-600`); neutral buttons fill to `--secondary`; links underline. Cards lift. Press is a gentle settle, not a hard shrink.
- **Borders & transparency:** `1px` hairlines, never heavy rules. Sticky header uses `rgba` background + `backdrop-blur` so content scrolls softly beneath it. Tinted pills use `color-mix` of the base colour at 12–15% with a faint inset ring.

---

## ICONOGRAPHY

- **Library: [Lucide](https://lucide.dev)** — the icon set the codebase already uses (`lucide-react`). Stroke-based, **2px stroke**, rounded caps and joins. This is the only icon system; keep it consistent.
- **In this system:** components use a dependency-free inline **`Icon`** component (`components/core/Icon.jsx`) carrying the Lucide path subset (`sparkles, map-pin, star, clock, users, phone, heart, shield-check, search, arrow-up, chevron-*, check, baby, graduation-cap, blocks, sun`). Specimen cards load Lucide from CDN (`unpkg.com/lucide`). For new work, either reuse `Icon` or pull from the Lucide CDN — don't hand-draw SVGs or mix icon families.
- **Logo / mark:** there is **no standalone logo file**. The brand mark is a **teal rounded-square (`radius-md`) containing the Lucide `sparkles` glyph in white**, set beside the **"Kindello"** wordmark (Geist semibold, `-0.02em` tracking). See the *Wordmark* brand card and `.k-mark` utility class. Reversed (white-on-teal) variant for dark footers.
- **Stars** use the `star` glyph filled with sunny-yellow `#FFC83D`. **No emoji, no unicode-glyph icons** in product UI (the `›` breadcrumb separator is the lone exception).

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import-only). Consumers link this.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `fonts.css`, `base.css`.
- `readme.md` — this guide. · `SKILL.md` — Agent-Skill wrapper.
- `kindello-light.png` — reference screenshot of the live chatbot app (context only).

**Components** (`components/`, namespace `window.KindelloDesignSystem_c65c52`)
- `core/` — `Button`, `Tag`, `RatingBadge`, `StarRating`, `PromptChip`, `Icon`.
- `directory/` — `CentreCard` (grid + featured), `CategoryTile`, `GuideCard`.
- `chat/` — `ConversationTabs`, `ChatComposer`, `UserBubble`, `FollowUps`, `PlaceResultCard`, `ContinueSearchCard`.

**UI kits** (`ui_kits/`)
- `kindello-web/` — the directory website: `index.html` click-through across **Homepage → Results → Centre detail**, composed from the components. Files: `Header.jsx`, `Footer.jsx`, `HomePage.jsx`, `ResultsPage.jsx`, `DetailPage.jsx`.

**Homepage chat experience** (`explorations/`) — visual reference mockups for the AI-search states (see next section). `index.html` is the side-by-side board; `active-chat-home.html` and `resting-continue.html` are the live click-through states.

**Foundation cards** (`guidelines/cards/`) — specimen `.html` populating the Design System tab (Colors, Type, Spacing, Brand).

---

## Using it

Consumers link one file:

```html
<link rel="stylesheet" href="styles.css" />
```

…and read components off the namespace after loading `_ds_bundle.js`:

```js
const { Button, CentreCard, RatingBadge } = window.KindelloDesignSystem_c65c52;
```

Tokens are CSS custom properties (`var(--color-primary)`, `var(--radius-xl)`, `var(--text-2xl)`, …).

---

## Homepage chat experience (AI search)

Kindello's hero is a Perplexity / Google AI-Mode style search. This section is the build spec for **Claude Code** — the four states, which components compose each, and a ready prompt per state. All pieces live in `components/chat/` (+ `core/` and `directory/`).

### The model (decisions already made)

- **Active chat is a *state* of the homepage, not a separate page.** On submit, the marketing hero + directory sections give way to the conversation, but the **homepage header stays** (logo, nav, Sign in) so parents keep context. The default homepage remains the canonical, SEO-indexable surface; chat is layered on top (optionally a shallow `?q=` query param so threads are shareable).
- **One global `Answer ⇄ Places` toggle** owns the whole conversation (not per-answer), left-aligned, **sticky** under the header. `ConversationTabs`.
- **Answer tab = the conversation:** user `UserBubble` → assistant reply (meta line “Answer · ACECQA · synced today”, prose with `acecqa.gov.au` source chips, an inline map preview with 2–3 floating result cards, a “Best near …” list), then `FollowUps`, with a pinned `ChatComposer size="md"` at the bottom. Multi-turn: tapping a follow-up appends the next turn.
- **Places tab = a bigger browse view of the *last* query only.** A grid of `PlaceResultCard` beside a larger map. **No composer, no follow-ups** — it's for viewing results on a map.
- **Exits:** `New search` (clears thread → resting hero) + logo/nav (→ full homepage). **No ✕/close on the homepage** (that's only for the embeddable widget build). Persist the current thread (sessionStorage) so back/refresh doesn't lose it.
- **Returning visitor:** the resting homepage gains a **“Pick up where you left off”** section *below the hero* — a 3-up grid of `ContinueSearchCard`. Card-based, directory-native; **no SaaS sidebar**. Anonymous = device history (localStorage); signed-in = synced history + saved shortlist (the card heart).

### The four states → components

| State | Composition |
|---|---|
| **1 · Homepage default** | `Header` · hero `ChatComposer size="lg"` (typewriter placeholder cycling AU queries) · `PromptChip` row · `CentreCard` grid · `CategoryTile` · area tiles · `GuideCard` · FAQ · `Footer` |
| **2 · Active — Answer** | `Header` · sticky `ConversationTabs` · `UserBubble` · answer prose + source chips + inline map preview + “Best near …” list · `FollowUps` · pinned `ChatComposer size="md"` |
| **3 · Active — Places** | `Header` · sticky `ConversationTabs (active="places")` · “Place results for: …” line · `PlaceResultCard` grid + larger map · (no composer/follow-ups) |
| **4 · Returning visitor** | State 1 + a “Pick up where you left off” section of `ContinueSearchCard` below the hero |

The map is shown here as a styled placeholder (gradient + pins). **In production use Mapbox GL** (the codebase already references Mapbox) with teal rating pins; keep the floating result cards in the top-right on the Answer preview.

### Claude Code prompts

Paste these with the design system in context (`styles.css` linked, components read from `window.KindelloDesignSystem_c65c52`, or the `.jsx` imported directly). Each component's `.prompt.md` has its API.

**Homepage (default + returning):**
> Build the Kindello homepage using the design-system components. Header with the teal sparkles mark + “Kindello” wordmark and nav (Browse, Locations, Guides, About, Sign in, List your centre). Hero on a `--teal-tint`→`--bg` gradient: badge “18,229 approved centres · updated daily”, H1 “Find the right childcare, faster.”, lede, then `ChatComposer size="lg"` with a **typewriter placeholder** cycling real AU queries (Parramatta, Surry Hills, Newcastle…), then a `PromptChip` row. Below: “Popular near you” `CentreCard` grid, “Browse by type” `CategoryTile`s, “Explore by area” tiles, “Guides for parents” `GuideCard`s, a collapsible FAQ, and the `Footer`. For a returning visitor, insert a “Pick up where you left off” section of `ContinueSearchCard`s (read from localStorage) directly below the hero. Sentence case, no emoji.

**Activate chat (Answer):**
> When the user submits, transition the homepage into chat mode: keep the header, hide the marketing sections, and render the conversation in a left-aligned 720px column. Add a **sticky** `ConversationTabs` (Answer active, Places count, New search) under the header. For each turn: a `UserBubble`, then the assistant answer — a meta line (“Answer · ACECQA · synced today”), an inline **Mapbox** preview with 2–3 floating result cards, prose with `acecqa.gov.au` source chips, a “Best near …” bullet list — then `FollowUps`. Pin a `ChatComposer size="md"` at the bottom. Tapping a follow-up appends a new turn. Persist the thread to sessionStorage.

**Places tab:**
> On the Places tab, render a bigger browse view of the **last** query: a heading “Place results for: <query>”, a grid of `PlaceResultCard`s, and a larger Mapbox map with teal rating pins. No composer and no follow-ups here. Switching back to Answer restores the conversation.

**New search / exits:**
> “New search” clears the thread and returns to the resting hero. The logo and nav return to the full default homepage. Do not add a close/✕ button on the homepage (reserve that for the embeddable widget). Optionally reflect the active query in a shallow `?q=` param for shareable links.
