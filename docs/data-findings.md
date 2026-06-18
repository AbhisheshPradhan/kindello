# Data findings — Kindello

Empirical characteristics of the ACECQA spine, measured directly from the local
`kindello` Postgres (18,229 services). These are observations to inform product
decisions, not schema docs. Add dated entries as we learn more; convert any
relative dates to absolute.

## 2026-06-18 — first pass over the loaded spine

### NQS overall rating distribution

| Rating | Count | Share |
| --- | --- | --- |
| Meeting NQS | 12,477 | 68.4% |
| Exceeding NQS | 3,222 | 17.7% |
| Working Towards NQS | 1,363 | 7.5% |
| (not yet rated) | 1,132 | 6.2% |
| Excellent | 25 | 0.1% |
| Significant Improvement Required | 10 | 0.1% |

**Takeaways**

- "Meeting NQS" is the mode but **not universal** — ~14% don't meet the standard
  or are unrated (Working Towards / not-yet-rated / Significant Improvement), and
  ~18% exceed it. The rating IS a real differentiator.
- The badge's signal is in the **outliers**, not the 68% baseline — hence the UI
  decision to keep the rating but let Exceeding/Excellent and Working-Towards pop
  while "Meeting" stays the quiet default.
- **Excellent is genuinely rare** (25 services nationwide) — treat it as a
  standout, not a common tier.

Query:

```sql
SELECT coalesce(overall_rating,'(not yet rated)') AS rating, count(*),
       round(100.0*count(*)/sum(count(*)) over (),1) AS pct
FROM services GROUP BY 1 ORDER BY 2 DESC;
```

### Service-type distribution (derived from the boolean flag columns)

Centre-Based Care carries 7 boolean flags (LDC / preschool stand-alone / preschool
part-of-school / OSHC before / after / vacation); Family Day Care is its own
`service_type`. Collapsed to a human label (`Long Day Care`, `Preschool`, `OSHC`,
joined with `·` when a service holds several):

| Type label | Share |
| --- | --- |
| Long Day Care | 42.4% |
| OSHC | 27.7% |
| Preschool | 16.5% |
| Long Day Care · OSHC | 6.0% |
| Long Day Care · Preschool | 3.7% |
| Family Day Care | 2.1% |
| Long Day Care · Preschool · OSHC | 1.1% |
| Preschool · OSHC | 0.4% |
| (blank → row hidden) | 4 rows |

**Takeaways**

- **Every Centre-Based Care service carries at least one specific flag** — the raw
  `Centre-Based Care` string never appears on its own. So the raw-value fallback in
  `web/lib/tools.ts` `serviceTypeLabel()` is dead code in practice; the flags are
  reliably populated.
- Only **4 of 18,229** services produce no type label at all (safe to hide the row).

### Field coverage

| Field | Coverage | Notes |
| --- | --- | --- |
| Phone | 17,545 / 18,229 (96.2%) | The **only** contact channel in the register. |
| Full address (street + suburb + state + postcode) | 18,223 / 18,229 (99.97%) | Only 6 missing. |
| Fax | present in source CSV | Not loaded; not worth surfacing. |
| Email | — | **Not in the ACECQA register at all** → Tier-2 enrichment. |
| Website / URL | — | **Not in the register** → Tier-2 enrichment. |

**Caveat (Family Day Care):** an FDC service's registered address is the
**scheme/coordinator office**, not where care happens (FDC runs out of educators'
homes). Don't present an FDC address as "the centre's location".
