import * as React from "react";

export interface PlaceResultCardProps {
  name?: string;
  suburb?: string;
  distance?: string;
  rating?: number;
  reviews?: number;
  /** Accent-coloured availability line, e.g. "3 places now". */
  placesNow?: string;
  phone?: string | null;
  verified?: boolean;
  /** Gradient photo-placeholder seed. */
  seed?: number;
  onMore?: () => void;
  style?: React.CSSProperties;
}

/**
 * Larger result card for the Places tab grid (photo, rating, availability,
 * address, phone, More info). For the homepage results grid use CentreCard.
 *
 * @startingPoint section="Chat" subtitle="Places-tab result card" viewport="320x300"
 */
export function PlaceResultCard(props: PlaceResultCardProps): React.JSX.Element;
