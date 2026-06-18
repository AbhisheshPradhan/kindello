import React from "react";
import { Icon } from "../core/Icon.jsx";

/**
 * ChatComposer — the Perplexity-style input. Used full-size as the hero
 * search and compact as the pinned follow-up bar. Search-mode pill + model
 * selector + round teal send button.
 */
export function ChatComposer({
  placeholder = "Ask a follow-up…",
  value = "",
  model = "Claude",
  onChange = () => {},
  onSubmit = () => {},
  size = "md",
  style = {},
}) {
  const big = size === "lg";
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
      style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: big ? "var(--radius-2xl)" : "var(--radius-xl)",
        boxShadow: big ? "var(--shadow-lg)" : "var(--shadow-md)",
        padding: big ? 18 : "14px 16px 11px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {big && <span style={{ color: "var(--teal-500)", marginTop: 2 }}><Icon name="sparkles" size={22} /></span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: "var(--font-sans)", fontSize: big ? 17 : 14.5,
            color: "var(--fg)", lineHeight: 1.5, padding: 0,
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: big ? 16 : 12 }}>
        {!big && (
          <span style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--muted-fg)" }}>
            <Icon name="search" size={16} />
          </span>
        )}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", padding: "6px 12px", fontSize: 13, fontWeight: 500, color: "var(--text-body)" }}>
          <Icon name="search" size={14} /> Search <Icon name="chevron-down" size={13} />
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "var(--muted-fg)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {model} <Icon name="chevron-down" size={13} />
        </span>
        <button type="submit" aria-label="Send" style={{ width: big ? 46 : 32, height: big ? 46 : 32, borderRadius: "var(--radius-pill)", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-teal)" }}>
          <Icon name="arrow-up" size={big ? 22 : 17} />
        </button>
      </div>
    </form>
  );
}
