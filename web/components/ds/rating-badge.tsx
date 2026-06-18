import type { CSSProperties, HTMLAttributes } from "react";

const MAP: Record<
	string,
	{ label: string; bg?: string; fg?: string; solid?: boolean; base?: string }
> = {
	Excellent: {
		label: "Excellent",
		bg: "var(--teal-500)",
		fg: "#fff",
		solid: true,
	},
	"Exceeding NQS": { label: "Exceeding", base: "var(--teal-500)" },
	"Meeting NQS": { label: "Meeting", base: "var(--rating-meeting)" },
	"Working Towards NQS": {
		label: "Working towards",
		base: "var(--rating-working)",
	},
	"Significant Improvement Required": {
		label: "Improvement required",
		base: "var(--rating-improve)",
	},
};

/**
 * RatingBadge — National Quality Standard rating pill, colour-coded best→worst.
 * Pass the raw ACECQA rating string; null/unknown renders "Not yet rated".
 */
export function RatingBadge({
	rating = null,
	style,
	...props
}: { rating?: string | null } & HTMLAttributes<HTMLSpanElement>) {
	const m = rating ? MAP[rating] : undefined;
	let css: CSSProperties;
	if (!m) {
		css = {
			background: "var(--secondary)",
			color: "var(--muted-fg)",
			boxShadow: "inset 0 0 0 1px var(--border)",
		};
	} else if (m.solid) {
		css = { background: m.bg, color: m.fg };
	} else {
		css = {
			background: `color-mix(in srgb, ${m.base} 14%, transparent)`,
			color: m.base,
			boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${m.base} 28%, transparent)`,
		};
	}
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				padding: "4px 11px",
				fontFamily: "var(--font-sans)",
				fontSize: 12.5,
				fontWeight: 600,
				lineHeight: 1.3,
				borderRadius: "var(--radius-pill)",
				whiteSpace: "nowrap",
				...css,
				...style,
			}}
			{...props}
		>
			{m ? m.label : "Not yet rated"}
		</span>
	);
}
