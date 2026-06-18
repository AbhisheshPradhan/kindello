**PlaceResultCard** — the result card for the Places tab (beside the map).

```jsx
<PlaceResultCard name="Little Gum Tree Early Learning" suburb="Surry Hills"
  distance="1.2 km" rating={4.8} reviews={126} placesNow="3 places now"
  phone="(02) 9311 4422" seed={0} />
```

Bigger and more data-dense than the homepage `CentreCard` — built for map-side scanning with a "More info" affordance. Photo is a gradient placeholder; swap for real imagery in production.
