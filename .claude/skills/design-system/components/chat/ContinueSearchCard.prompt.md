**ContinueSearchCard** — a recent-search card for the homepage resting state.

```jsx
<ContinueSearchCard
  query="Long day care for a 2 year old near Surry Hills, exceeding rated with places now"
  summary="6 centres · 3 with places now" when="2 days ago"
  pins={[[30,50],[54,40],[46,66]]} onResume={() => resume(id)} />
```

Lay several in a 3-up grid under a "Pick up where you left off" heading, **only in the empty/resting state** (never over a live answer). Anonymous = device history (localStorage); signed-in = synced. Card-based on purpose — no SaaS sidebar.
