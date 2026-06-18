**ConversationTabs** — the single Answer ⇄ Places toggle that owns a whole conversation (not per-answer), with "New search" on the right.

```jsx
const [tab, setTab] = useState("answer");
<ConversationTabs active={tab} placesCount={6} onSelect={setTab}
  onNewSearch={() => reset()} sticky top={59} />
```

Left-aligned to match the conversation column. Set `sticky` so it pins under the site header. Answer = the chat; Places = a map browse of the last query. Only render the composer/follow-ups under the Answer tab.
