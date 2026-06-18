import React from "react";

/**
 * Kindello Button — the primary action primitive.
 * Variants map to the app's shadcn button set, plus a coral `accent` for
 * high-intent CTAs (Enquire, Find care).
 */
export function Button({
  variant = "primary",
  size = "md",
  full = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  children,
  ...props
}) {
  const sizes = {
    sm: { height: 34, padding: "0 14px", fontSize: 14, gap: 6 },
    md: { height: 42, padding: "0 20px", fontSize: 15, gap: 8 },
    lg: { height: 50, padding: "0 28px", fontSize: 16, gap: 8 },
  };
  const variants = {
    primary: { background: "var(--color-primary)", color: "#fff", border: "1px solid transparent" },
    accent: { background: "var(--color-accent)", color: "#fff", border: "1px solid transparent" },
    secondary: { background: "var(--secondary)", color: "var(--fg)", border: "1px solid transparent" },
    outline: { background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--fg)", border: "1px solid transparent" },
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;

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
        boxShadow: variant === "accent" ? "var(--shadow-coral)" : variant === "primary" ? "var(--shadow-teal)" : "none",
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === "primary") e.currentTarget.style.background = "var(--color-primary-hover)";
        else if (variant === "accent") e.currentTarget.style.background = "var(--color-accent-hover)";
        else if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "var(--secondary)";
        else if (variant === "secondary") e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = v.background;
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
