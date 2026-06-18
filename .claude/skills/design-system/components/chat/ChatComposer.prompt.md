**ChatComposer** — the search input, Perplexity-style.

```jsx
<ChatComposer size="lg" placeholder="Tell us what you're looking for — e.g. Montessori daycare in Surry Hills with outdoor space" onSubmit={ask} />
<ChatComposer size="md" placeholder="Ask a follow-up…" onSubmit={ask} />
```

`lg` is the hero focal point (sparkles icon, big rounding, teal-glow send). `md` is the slim bar pinned under the Answer thread. Both carry a Search-mode pill and model selector. Pair the hero with a typewriter placeholder cycling real AU queries.
