import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `accent` is the coral high-intent CTA. */
  variant?: "primary" | "accent" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Stretch to container width. */
  full?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * Kindello's primary button. Teal `primary` for main actions, coral `accent`
 * for Enquire / Find care, neutral `outline`/`ghost` for secondary actions.
 *
 * @startingPoint section="Core" subtitle="Button — primary, accent, outline, ghost" viewport="700x150"
 */
export function Button(props: ButtonProps): React.JSX.Element;
