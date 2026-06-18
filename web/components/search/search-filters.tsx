"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/ds/icon";

const TYPES = [
  { value: "", label: "All care types" },
  { value: "long_day_care", label: "Long day care" },
  { value: "family_day_care", label: "Family day care" },
  { value: "preschool", label: "Preschool & kindy" },
  { value: "oshc", label: "Outside school hours" },
];

const RATINGS = [
  { value: "", label: "Any rating" },
  { value: "Meeting NQS", label: "Meeting NQS or better" },
  { value: "Exceeding NQS", label: "Exceeding NQS or better" },
  { value: "Excellent", label: "Excellent only" },
];

const selectWrap: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
};
const selectStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-pill)",
  padding: "9px 34px 9px 16px",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 500,
  color: "var(--text-body)",
  cursor: "pointer",
  outline: "none",
  boxShadow: "var(--shadow-xs)",
};

/** Filter bar for the results grid — updates the URL query, server re-queries. */
export function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [suburb, setSuburb] = useState(params.get("suburb") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/search?${next.toString()}`);
  }

  function submitSuburb(e: React.FormEvent) {
    e.preventDefault();
    update("suburb", suburb.trim());
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <form onSubmit={submitSuburb} style={{ ...selectWrap }}>
        <span style={{ position: "absolute", left: 14, color: "var(--muted-fg)", pointerEvents: "none" }}>
          <Icon name="map-pin" size={16} />
        </span>
        <input
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          placeholder="Suburb or town"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            padding: "9px 16px 9px 38px",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--fg)",
            outline: "none",
            boxShadow: "var(--shadow-xs)",
            minWidth: 180,
          }}
        />
      </form>

      <div style={selectWrap}>
        <select
          aria-label="Care type"
          value={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
          style={selectStyle}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 12, color: "var(--muted-fg)", pointerEvents: "none" }}>
          <Icon name="chevron-down" size={15} />
        </span>
      </div>

      <div style={selectWrap}>
        <select
          aria-label="Minimum rating"
          value={params.get("minRating") ?? ""}
          onChange={(e) => update("minRating", e.target.value)}
          style={selectStyle}
        >
          {RATINGS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 12, color: "var(--muted-fg)", pointerEvents: "none" }}>
          <Icon name="chevron-down" size={15} />
        </span>
      </div>
    </div>
  );
}
