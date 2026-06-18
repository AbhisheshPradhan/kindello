import React from "react";

// Inline Lucide paths (the app's icon set) so components stay dependency-free.
const PATHS = {
  star: <path d="M11.5 2.8 14 8l5.7.8-4.1 4 1 5.7-5.1-2.7L6.3 18.5l1-5.7-4.1-4L8.9 8z" />,
  "map-pin": (
    <>
      <path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 19v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  phone: <path d="M14.5 3.5a16 16 0 0 0 6 6l-2 2a2 2 0 0 1-2 .5 13 13 0 0 1-5-3 13 13 0 0 1-3-5 2 2 0 0 1 .5-2l2-2" />,
  heart: <path d="M19 5.5a4.5 4.5 0 0 0-7 1 4.5 4.5 0 0 0-7-1c-2 2-1.5 5 1 7.5l6 6 6-6c2.5-2.5 3-5.5 1-7.5Z" />,
  "shield-check": (
    <>
      <path d="M12 3 5 6v5c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  "arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  baby: (
    <>
      <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path d="M19 6.3a9 9 0 0 1-8 5.7A9 9 0 0 1 3 6.3" />
      <path d="M3 12a9 9 0 0 0 18 0" />
    </>
  ),
  "graduation-cap": (
    <>
      <path d="M22 9 12 5 2 9l10 4 10-4Z" />
      <path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4" />
    </>
  ),
  blocks: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
      <path d="M11 7h4a2 2 0 0 1 2 2v4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
};

/** Inline icon (Lucide path set). Stroke-based, inherits currentColor. */
export function Icon({ name, size = 20, strokeWidth = 2, style = {}, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      {...props}
    >
      {PATHS[name] || null}
    </svg>
  );
}
