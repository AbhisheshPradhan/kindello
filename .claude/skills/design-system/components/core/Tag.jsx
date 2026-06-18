import React from "react";

/**
 * Tag — a small rounded pill for centre attributes ("Montessori",
 * "Outdoor space", "Ages 0–5"). Tonal variants tint the pill.
 */
export function Tag({ tone = "neutral", style = {}, children, ...props }) {
  const tones = {
    neutral: { background: "var(--secondary)", color: "var(--text-body)" },
    teal: { background: "var(--teal-50)", color: "var(--teal-700)" },
    coral: { background: "var(--coral-100)", color: "var(--coral-600)" },
    sun: { background: "var(--sun-100)", color: "var(--sun-500)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 11px",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.4,
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        ...t,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
