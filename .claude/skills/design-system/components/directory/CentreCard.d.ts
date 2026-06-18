import * as React from "react";

export interface CentreCardProps {
  name?: string;
  /** Alias for `name` — use this when binding via x-import, where `name` is reserved. */
  centreName?: string | null;
  suburb?: string;
  /** e.g. "1.2 km" — appended after the suburb. */
  distance?: string;
  rating?: number;
  reviews?: number;
  /** Raw ACECQA NQS rating string. */
  nqs?: string | null;
  /** Attribute pills. */
  tags?: string[];
  /** Accent-coloured key line (e.g. "Places available"). */
  keyInfo?: string;
  verified?: boolean;
  /** Photo-placeholder gradient seed. */
  seed?: number;
  /** Enlarged horizontal layout (photo left). */
  featured?: boolean;
  style?: React.CSSProperties;
}

/**
 * The core Kindello listing card. Compact grid card by default; pass
 * `featured` for the enlarged horizontal hero card.
 *
 * @startingPoint section="Directory" subtitle="Centre listing card — grid + featured" viewport="380x420"
 */
export function CentreCard(props: CentreCardProps): React.JSX.Element;
