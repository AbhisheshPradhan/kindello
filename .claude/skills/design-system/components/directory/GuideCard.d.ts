import * as React from "react";

export interface GuideCardProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title?: string;
  category?: string;
  readTime?: string;
  /** Gradient thumbnail seed. */
  seed?: number;
}

/** Parent-guide article card with gradient thumbnail. */
export function GuideCard(props: GuideCardProps): React.JSX.Element;
