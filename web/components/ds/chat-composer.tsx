"use client";

import { useRef, type CSSProperties } from "react";
import { Icon } from "./icon";

export type ComposerModel = { id: string; label: string };

/**
 * ChatComposer — the Perplexity-style search input. `lg` is the hero focal
 * point (sparkles icon, big rounding, teal-glow send); `md` is the slim bar
 * pinned under the Answer thread. Controlled. The model selector is a real
 * native <select> when `models` is supplied.
 */
export function ChatComposer({
  placeholder = "Ask a follow-up…",
  value,
  onChange,
  onSubmit,
  size = "md",
  disabled = false,
  autoFocus = false,
  models,
  model,
  onModelChange,
  placeholderOverlay,
  style,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  size?: "md" | "lg";
  disabled?: boolean;
  autoFocus?: boolean;
  models?: ComposerModel[];
  model?: string;
  onModelChange?: (id: string) => void;
  /** Optional node rendered behind the input (e.g. a typewriter placeholder). */
  placeholderOverlay?: React.ReactNode;
  style?: CSSProperties;
}) {
  const big = size === "lg";
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedLabel = models?.find((m) => m.id === model)?.label ?? "Claude";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit(value);
      }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: big ? "var(--radius-2xl)" : "var(--radius-xl)",
        boxShadow: big ? "var(--shadow-lg)" : "var(--shadow-md)",
        padding: big ? 18 : "14px 16px 11px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {big && (
          <span style={{ color: "var(--teal-500)", marginTop: 2, flex: "none" }}>
            <Icon name="sparkles" size={22} />
          </span>
        )}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          {placeholderOverlay && value === "" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                fontFamily: "var(--font-sans)",
                fontSize: big ? 17 : 14.5,
                color: "var(--muted-fg)",
                lineHeight: 1.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {placeholderOverlay}
            </div>
          )}
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholderOverlay ? "" : placeholder}
            autoFocus={autoFocus}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: big ? 17 : 14.5,
              color: "var(--fg)",
              lineHeight: 1.5,
              padding: 0,
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: big ? 16 : 12 }}>
        {!big && (
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--border)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted-fg)",
            }}
          >
            <Icon name="search" size={16} />
          </span>
        )}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-body)",
          }}
        >
          <Icon name="search" size={14} /> Search
        </span>
        <span style={{ flex: 1 }} />
        {models && onModelChange ? (
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <select
              aria-label="Model"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              // The hero composer steals focus on click; stop bubbling so the native
              // dropdown isn't slammed shut by that focus-steal.
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                background: "transparent",
                border: "none",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--muted-fg)",
                cursor: "pointer",
                padding: "0 18px 0 0",
                outline: "none",
              }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 0, color: "var(--muted-fg)", pointerEvents: "none" }}>
              <Icon name="chevron-down" size={13} />
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: "var(--muted-fg)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {selectedLabel} <Icon name="chevron-down" size={13} />
          </span>
        )}
        <button
          type="submit"
          aria-label="Send"
          disabled={disabled}
          style={{
            width: big ? 46 : 32,
            height: big ? 46 : 32,
            borderRadius: "var(--radius-pill)",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.55 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-teal)",
            transition: "opacity .15s ease",
          }}
        >
          <Icon name="arrow-up" size={big ? 22 : 17} />
        </button>
      </div>
    </form>
  );
}
