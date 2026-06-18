**CentreCard** — the core childcare listing card (composes Tag, RatingBadge, StarRating, Icon).

```jsx
<CentreCard name="Little Gum Tree Early Learning" suburb="Surry Hills"
  distance="1.2 km" rating={4.8} reviews={126} nqs="Exceeding NQS"
  tags={["Montessori","Outdoor space"]} keyInfo="Places available" seed={0} />

<CentreCard featured name="Little Gum Tree Early Learning" ... />
```

Default = compact, centred grid card (photo on top). `featured` = enlarged horizontal card (photo left, detail right). Photo is a warm gradient placeholder keyed by `seed`. Includes a Verified badge and a save/heart toggle.
