import * as React from "react";

export interface UserBubbleProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** A parent's chat message — right-aligned teal bubble. */
export function UserBubble(props: UserBubbleProps): React.JSX.Element;
