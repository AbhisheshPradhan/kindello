import * as React from "react";

export interface StarRatingProps {
  /** 0–5, supports decimals (half-fill). */
  value?: number;
  /** Review count shown after the score. */
  count?: number | null;
  size?: number;
  /** Hide the numeric "4.8 · 126 reviews" text. */
  showValue?: boolean;
  style?: React.CSSProperties;
}

/** Sunny-yellow star rating with score and review count. */
export function StarRating(props: StarRatingProps): React.JSX.Element;
