"use client";

import type { CSSProperties } from "react";

/**
 * FollowUps — Perplexity-style suggested next questions: a titled list of
 * tappable rows with a corner-return arrow and hairline dividers. Answer tab
 * only — never on Places.
 */
export function FollowUps({
  title = "Follow-ups",
  items = [],
  onSelect,
  style,
}: {
  title?: string;
  items: string[];
  onSelect: (q: string) => void;
  style?: CSSProperties;
}) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 24, ...style }}>
      <h4
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--fg)",
          margin: "0 0 4px",
        }}
      >
        {title}
      </h4>
      {items.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            padding: "14px 2px",
            background: "none",
            border: "none",
            borderTop: "1px solid var(--border)",
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 15.5,
            color: "var(--text-body)",
            transition: "color .15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--teal-700)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-body)")}
        >
          <span style={{ color: "var(--muted-fg)", flex: "none", display: "inline-flex" }}>
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4v7a4 4 0 0 0 4 4h12" />
              <path d="m15 10 5 5-5 5" />
            </svg>
          </span>
          <span style={{ flex: 1 }}>{q}</span>
        </button>
      ))}
    </div>
  );
}
