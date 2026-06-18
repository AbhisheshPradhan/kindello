import * as React from "react";

export interface ConversationTabsProps {
  active?: "answer" | "places";
  /** Count badge on the Places tab. */
  placesCount?: number | null;
  onSelect?: (tab: "answer" | "places") => void;
  /** Show a "New search" button on the right; omit to hide. */
  onNewSearch?: (() => void) | null;
  /** Pin under the header while the thread scrolls. */
  sticky?: boolean;
  /** Sticky offset in px (header height). */
  top?: number;
  style?: React.CSSProperties;
}

/**
 * The one global Answer ⇄ Places toggle for a conversation, with an optional
 * "New search". Left-aligned, sticky-capable.
 *
 * @startingPoint section="Chat" subtitle="Answer / Places conversation toggle" viewport="760x60"
 */
export function ConversationTabs(props: ConversationTabsProps): React.JSX.Element;
