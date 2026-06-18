import React from "react";

/**
 * GuideCard — parent-guide article card. Gradient thumbnail, category
 * eyebrow, title, read-time.
 */
export function GuideCard({ title = "How to read an NQS rating", category = "Choosing care", readTime = "5 min read", seed = 0, style = {}, ...props }) {
  const grads = [
    "linear-gradient(120deg, #57c5c5, #1ca6a6)",
    "linear-gradient(120deg, #ffd766, #ff8166)",
    "linear-gradient(120deg, #2fb3b3, #136d6d)",
  ];
  return (
    <a
      style={{
        display: "flex", flexDirection: "column",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)", overflow: "hidden", textDecoration: "none",
        boxShadow: "var(--shadow-sm)", transition: "all .18s ease", cursor: "pointer",
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}
      {...props}
    >
      <div style={{ height: 150, background: grads[seed % grads.length] }} />
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--teal-600)" }}>{category}</span>
        <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)", lineHeight: 1.3 }}>{title}</h3>
        <span style={{ fontSize: 13, color: "var(--muted-fg)" }}>{readTime}</span>
      </div>
    </a>
  );
}
