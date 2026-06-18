import * as React from "react";

export interface ChatComposerProps {
  placeholder?: string;
  value?: string;
  /** Model label shown bottom-right. */
  model?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  /** `lg` = hero search (sparkles, big radius/shadow); `md` = pinned follow-up bar. */
  size?: "md" | "lg";
  style?: React.CSSProperties;
}

/**
 * Perplexity-style chat input. `lg` for the hero, `md` for the follow-up bar.
 *
 * @startingPoint section="Chat" subtitle="Hero / follow-up chat input" viewport="720x120"
 */
export function ChatComposer(props: ChatComposerProps): React.JSX.Element;
