"use client";

import type { CSSProperties } from "react";

/**
 * FollowUps — Perplexity-style suggested next questions: a titled list of
 * tappable rows with a corner-return arrow and hairline dividers. Answer tab
 * only — never on Places.
 */
export function FollowUps({
	title = "Follow-ups",
	items = [],
	onSelect,
	style,
}: {
	title?: string;
	items: string[];
	onSelect: (q: string) => void;
	style?: CSSProperties;
}) {
	if (!items.length) return null;
	return (
		<div
			className="mt-6"
			style={style}
		>
			<h4 className="font-sans text-[19px] font-semibold tracking-[-0.01em] text-foreground mt-0 mb-1 mx-0">
				{title}
			</h4>
			{items.map((q, i) => (
				<button
					key={i}
					onClick={() => onSelect(q)}
					className="flex items-center gap-3.5 w-full py-3.5 px-0.5 bg-none border-none border-t text-left font-sans text-[15.5px] text-body transition-colors duration-150 hover:text-teal-700"
				>
					<span className="text-muted-foreground flex-none inline-flex">
						<svg
							viewBox="0 0 24 24"
							width="17"
							height="17"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M4 4v7a4 4 0 0 0 4 4h12" />
							<path d="m15 10 5 5-5 5" />
						</svg>
					</span>
					<span className="flex-1">{q}</span>
				</button>
			))}
		</div>
	);
}
