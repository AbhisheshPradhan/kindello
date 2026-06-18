**RatingBadge** — National Quality Standard rating pill, colour-coded.

```jsx
<RatingBadge rating="Exceeding NQS" />
<RatingBadge rating={null} /> {/* Not yet rated */}
```

Pass the raw ACECQA rating string. Teal = best (Excellent/Exceeding), blue = Meeting, amber = Working towards, red = Improvement required, grey = Not yet rated.
