"use client";

import type { CSSProperties } from "react";
import { Icon, type IconName } from "./icon";

/**
 * ConversationTabs — the single Answer ⇄ Places toggle that owns a whole
 * conversation, with a "New search" action on the right. Sticky-capable so it
 * pins under the site header as the thread scrolls.
 */
export function ConversationTabs({
  active = "answer",
  placesCount = null,
  onSelect,
  onNewSearch,
  sticky = false,
  top = 59,
  style,
}: {
  active?: "answer" | "places";
  placesCount?: number | null;
  onSelect: (id: "answer" | "places") => void;
  onNewSearch?: (() => void) | null;
  sticky?: boolean;
  top?: number;
  style?: CSSProperties;
}) {
  const tab = (id: "answer" | "places", label: string, icon: IconName, count: number | null) => {
    const on = active === id;
    return (
      <button
        onClick={() => onSelect(id)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 2px",
          marginBottom: -1,
          fontFamily: "var(--font-sans)",
          fontSize: 14.5,
          fontWeight: on ? 600 : 500,
          color: on ? "var(--fg)" : "var(--muted-fg)",
          background: "none",
          border: "none",
          borderBottom: `2px solid ${on ? "var(--teal-500)" : "transparent"}`,
          cursor: "pointer",
        }}
      >
        <Icon name={icon} size={15} />
        {label}
        {count != null && (
          <span
            style={{
              fontSize: 11,
              padding: "1px 6px",
              borderRadius: "var(--radius-pill)",
              background: on ? "var(--teal-50)" : "var(--secondary)",
              color: on ? "var(--teal-700)" : "var(--muted-fg)",
            }}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        borderBottom: "1px solid var(--border)",
        ...(sticky
          ? { position: "sticky", top, zIndex: 15, background: "var(--bg)", paddingTop: 18 }
          : {}),
        ...style,
      }}
    >
      {tab("answer", "Answer", "sparkles", null)}
      {tab("places", "Places", "map-pin", placesCount)}
      {onNewSearch && (
        <button
          onClick={onNewSearch}
          style={{
            marginLeft: "auto",
            marginBottom: 7,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text-body)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "7px 13px",
            cursor: "pointer",
          }}
        >
          <Icon name="search" size={14} /> New search
        </button>
      )}
    </div>
  );
}
