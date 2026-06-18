import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "teal" | "coral" | "sun";

/** Tag — a small rounded pill for centre attributes ("Montessori", "Ages 0–5"). */
export function Tag({
  tone = "neutral",
  style,
  children,
  ...props
}: { tone?: Tone; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  const tones: Record<Tone, CSSProperties> = {
    neutral: { background: "var(--secondary)", color: "var(--text-body)" },
    teal: { background: "var(--teal-50)", color: "var(--teal-700)" },
    coral: { background: "var(--coral-100)", color: "var(--coral-600)" },
    sun: { background: "var(--sun-100)", color: "var(--sun-500)" },
  };
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
        ...tones[tone],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
