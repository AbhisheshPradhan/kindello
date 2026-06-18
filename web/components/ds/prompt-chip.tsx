"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * PromptChip — suggested-prompt pill for the hero search ("Long day care
 * near me", "Open weekends"). Rounded, hover lifts to a teal tint.
 */
export function PromptChip({
  style,
  children,
  ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--text-body)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pill)",
        cursor: "pointer",
        boxShadow: "var(--shadow-xs)",
        transition: "all .15s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--teal-50)";
        e.currentTarget.style.borderColor = "var(--teal-200)";
        e.currentTarget.style.color = "var(--teal-700)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text-body)";
      }}
      {...props}
    >
      {children}
    </button>
  );
}
