import * as React from "react";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tonal tint of the pill. */
  tone?: "neutral" | "teal" | "coral" | "sun";
}

/** Small rounded pill for centre attributes (Montessori, Outdoor space, Ages 0–5). */
export function Tag(props: TagProps): React.JSX.Element;
