import * as React from "react";

export interface ContinueSearchCardProps {
  /** The past query text. */
  query?: string;
  /** Result summary line, e.g. "6 centres · 3 with places now". */
  summary?: string;
  /** Recency label, e.g. "2 days ago". */
  when?: string;
  /** Mini-map pin positions as [x%, y%] pairs. */
  pins?: [number, number][];
  onResume?: () => void;
  style?: React.CSSProperties;
}

/**
 * Recent-search card for the homepage "Pick up where you left off" section.
 *
 * @startingPoint section="Chat" subtitle="Resume a recent search card" viewport="340x300"
 */
export function ContinueSearchCard(props: ContinueSearchCardProps): React.JSX.Element;
