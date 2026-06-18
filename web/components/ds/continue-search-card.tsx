"use client";

import type { CSSProperties } from "react";
import { Icon } from "./icon";

/**
 * ContinueSearchCard — a recent-search card for the homepage resting state's
 * "Pick up where you left off" section. Mini-map thumbnail (pins), recency, the
 * past query, a result summary, and a Continue affordance. Resting state only.
 */
export function ContinueSearchCard({
  query = "Long day care for a 2 year old near Surry Hills",
  summary = "6 centres · 3 with places now",
  when = "2 days ago",
  pins = [
    [30, 50],
    [54, 40],
    [46, 66],
  ],
  onResume,
  style,
}: {
  query?: string;
  summary?: string;
  when?: string;
  pins?: [number, number][];
  onResume?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onResume}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        padding: 0,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        transition: "box-shadow .18s ease, transform .18s ease, border-color .18s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--teal-200)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ height: 116, position: "relative", background: "color-mix(in srgb, var(--teal-500) 8%, var(--secondary))" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "54%", height: 2, background: "var(--surface)" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: "38%", width: 2, background: "var(--surface)" }} />
        {pins.map(([x, y], i) => (
          <span key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-100%)" }}>
            <span
              style={{
                display: "block",
                width: 12,
                height: 12,
                borderRadius: "var(--radius-pill)",
                background: "var(--teal-500)",
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,.3)",
              }}
            />
          </span>
        ))}
      </div>
      <div style={{ padding: "15px 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted-fg)" }}>
          <Icon name="clock" size={13} /> {when}
        </span>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--fg)", lineHeight: 1.4 }}>{query}</span>
        <span style={{ fontSize: 13, color: "var(--muted-fg)" }}>{summary}</span>
        <span
          style={{
            marginTop: "auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: 10,
            borderRadius: "var(--radius-md)",
            background: "var(--teal-50)",
            color: "var(--teal-700)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Continue <Icon name="chevron-right" size={15} />
        </span>
      </div>
    </button>
  );
}
