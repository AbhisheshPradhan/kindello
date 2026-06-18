import React from "react";

/** UserBubble — a parent's message: right-aligned teal chat bubble. */
export function UserBubble({ children, style = {} }) {
  return (
    <div
      style={{
        width: "fit-content", maxWidth: "78%", marginLeft: "auto",
        background: "var(--color-primary)", color: "#fff",
        padding: "11px 16px", borderRadius: "18px 18px 4px 18px",
        fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.45,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
