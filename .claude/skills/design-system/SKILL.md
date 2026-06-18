---
name: kindello-design
description: Use this skill to generate well-branded interfaces and assets for Kindello, an AI-powered Australian childcare directory, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md (readme.md) file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Brand:** Kindello — warm, trustworthy, playful childcare directory for Australia. Teal `#1CA6A6` primary; coral `#F9603F` + sunny-yellow `#FFC83D` accents; warm off-white surfaces; Geist + Geist Mono; Lucide icons; friendly rounded corners (12px base, full pills for chips/tags). Sentence case, plain "you/we" copy, no emoji.
- **Tokens:** `styles.css` → `tokens/*.css`. CSS custom properties (`--color-primary`, `--radius-xl`, `--text-2xl`, `--shadow-sm`, …).
- **Components:** `components/core/` (Button, Tag, RatingBadge, StarRating, PromptChip, Icon) and `components/directory/` (CentreCard, CategoryTile, GuideCard). Compiled to `_ds_bundle.js`; read via `window.KindelloDesignSystem_c65c52`.
- **UI kit:** `ui_kits/kindello-web/` — full directory website (home / results / centre detail), click-through.
- **Foundations:** `guidelines/cards/` specimen HTML.

Lift exact hex/spacing/type values from the tokens — don't approximate. The README's CONTENT FUNDAMENTALS, VISUAL FOUNDATIONS and ICONOGRAPHY sections are the source of truth for tone and look.
