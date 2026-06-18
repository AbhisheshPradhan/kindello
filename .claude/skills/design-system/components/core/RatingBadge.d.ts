import * as React from "react";

export interface RatingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Raw NQS rating string from the ACECQA spine. Null → "Not yet rated". */
  rating?:
    | "Excellent"
    | "Exceeding NQS"
    | "Meeting NQS"
    | "Working Towards NQS"
    | "Significant Improvement Required"
    | null;
}

/** NQS quality-rating pill, colour-coded best→worst. Mirrors the app's centre-card. */
export function RatingBadge(props: RatingBadgeProps): React.JSX.Element;
