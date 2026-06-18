import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Labels restore ACECQA's official tier names (we previously abbreviated them);
// `desc` is the hover/focus explainer that decodes "NQS" = National Quality
// Standard so the acronym is never a dead end. Shown via the native `title`.
const MAP: Record<
	string,
	{
		label: string;
		desc: string;
		bg?: string;
		fg?: string;
		solid?: boolean;
		base?: string;
	}
> = {
	Excellent: {
		label: "Excellent",
		desc: "Excellent — the highest National Quality Standard rating, awarded by ACECQA above Exceeding.",
		bg: "var(--teal-500)",
		fg: "#fff",
		solid: true,
	},
	"Exceeding NQS": {
		label: "Exceeding NQS",
		desc: "Exceeding the National Quality Standard — goes beyond the required standard.",
		base: "var(--teal-500)",
	},
	"Meeting NQS": {
		label: "Meeting NQS",
		desc: "Meeting the National Quality Standard — the government quality benchmark every centre is assessed against.",
		base: "var(--rating-meeting)",
	},
	"Working Towards NQS": {
		label: "Working Towards NQS",
		desc: "Working Towards the National Quality Standard — not yet meeting it in one or more areas.",
		base: "var(--rating-working)",
	},
	"Significant Improvement Required": {
		label: "Improvement required",
		desc: "Significant Improvement Required — not meeting the National Quality Standard; regulator action required.",
		base: "var(--rating-improve)",
	},
};

/**
 * RatingBadge — National Quality Standard rating pill, colour-coded best→worst.
 * Pass the raw ACECQA rating string; null/unknown renders "Not yet rated".
 * Layout is utility-driven; the rating-derived fill/ring stays inline because
 * it's a runtime color-mix off the tier's base colour.
 */
export function RatingBadge({
	rating = null,
	style,
	className,
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
			title={
				props.title ??
				(m
					? m.desc
					: "Not yet rated against the National Quality Standard.")
			}
			className={cn(
				"inline-flex items-center px-2.75 py-1 font-sans text-[12.5px] font-semibold leading-[1.3] rounded-full whitespace-nowrap",
				className,
			)}
			style={{ ...css, ...style }}
			{...props}
		>
			{m ? m.label : "Not yet rated"}
		</span>
	);
}
