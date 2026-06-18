import * as React from "react";

export interface IconProps extends React.SVGAttributes<SVGElement> {
  /** Lucide glyph name from the bundled set. */
  name:
    | "star" | "map-pin" | "clock" | "users" | "phone" | "heart"
    | "shield-check" | "sparkles" | "search" | "arrow-up"
    | "chevron-right" | "chevron-down" | "check" | "baby"
    | "graduation-cap" | "blocks" | "sun";
  size?: number;
  strokeWidth?: number;
}

/** Inline Lucide icon — dependency-free, inherits currentColor. */
export function Icon(props: IconProps): React.JSX.Element;
