import * as React from "react";

export interface FollowUpsProps {
  title?: string;
  /** Suggested next questions. */
  items?: string[];
  onSelect?: (question: string) => void;
  style?: React.CSSProperties;
}

/** Perplexity-style "Follow-ups" list — tappable next questions. Answer tab only. */
export function FollowUps(props: FollowUpsProps): React.JSX.Element;
