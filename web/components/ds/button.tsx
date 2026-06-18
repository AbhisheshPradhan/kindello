"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

/**
 * Kindello Button — the action primitive. `primary` is teal, `accent` is the
 * coral high-intent CTA (Enquire, Find care) with a soft glow.
 */
export function Button({
  variant = "primary",
  size = "md",
  full = false,
  iconLeft = null,
  iconRight = null,
  style,
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes: Record<Size, CSSProperties> = {
    sm: { height: 34, padding: "0 14px", fontSize: 14, gap: 6 },
    md: { height: 42, padding: "0 20px", fontSize: 15, gap: 8 },
    lg: { height: 50, padding: "0 28px", fontSize: 16, gap: 8 },
  };
  const variants: Record<Variant, CSSProperties> = {
    primary: { background: "var(--color-primary)", color: "#fff", border: "1px solid transparent" },
    accent: { background: "var(--brand-accent)", color: "#fff", border: "1px solid transparent" },
    secondary: { background: "var(--secondary)", color: "var(--fg)", border: "1px solid transparent" },
    outline: { background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--fg)", border: "1px solid transparent" },
  };
  const s = sizes[size];
  const v = variants[variant];

  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        width: full ? "100%" : "auto",
        fontFamily: "var(--font-sans)",
        fontSize: s.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background .15s ease, opacity .15s ease, box-shadow .15s ease",
        boxShadow:
          variant === "accent" ? "var(--shadow-coral)" : variant === "primary" ? "var(--shadow-teal)" : "none",
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === "primary") e.currentTarget.style.background = "var(--color-primary-hover)";
        else if (variant === "accent") e.currentTarget.style.background = "var(--brand-accent-hover)";
        else if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "var(--secondary)";
        else if (variant === "secondary") e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = String(v.background);
        e.currentTarget.style.opacity = "1";
      }}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
