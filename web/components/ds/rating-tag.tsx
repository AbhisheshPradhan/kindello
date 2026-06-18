import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

// Canonical NQS rating tag, shown throughout the app (cards, pin popups, detail pages).
// Excellent is a solid teal pill with a gold sparkle; the rest are soft tinted pills in
// their tier colour. Short labels by default; pass `long` for the full ACECQA name.
const TIERS: Record<
	string,
	{ label: string; long: string; color: string; solid?: boolean; desc: string }
> = {
	Excellent: {
		label: "Excellent",
		long: "Excellent",
		color: "#1ca6a6",
		solid: true,
		desc: "Excellent — the highest National Quality Standard rating, awarded by ACECQA above Exceeding.",
	},
	"Exceeding NQS": {
		label: "Exceeding",
		long: "Exceeding NQS",
		color: "#1ca6a6",
		desc: "Exceeding the National Quality Standard — goes beyond the required standard.",
	},
	"Meeting NQS": {
		label: "Meeting",
		long: "Meeting NQS",
		color: "#2f7fe0",
		desc: "Meeting the National Quality Standard — the benchmark every centre is assessed against.",
	},
	"Working Towards NQS": {
		label: "Working towards",
		long: "Working Towards NQS",
		color: "#d68a16",
		desc: "Working Towards the National Quality Standard — not yet meeting it in one or more areas.",
	},
	"Significant Improvement Required": {
		label: "Improvement required",
		long: "Significant Improvement Required",
		color: "#d6453f",
		desc: "Significant Improvement Required — not meeting the National Quality Standard.",
	},
};

const SIZES = {
	sm: "text-[12px] px-2.5 py-0.75 gap-1",
	md: "text-[13.5px] px-3 py-1 gap-1.25",
	lg: "text-[15px] px-3.5 py-1.5 gap-1.5",
} as const;

/**
 * RatingTag — the app-wide NQS rating pill. Pass the raw ACECQA rating string;
 * null/unknown renders a neutral "Not yet rated". The tier-derived fill stays
 * inline because it's a runtime color-mix off the tier colour.
 */
export function RatingTag({
	rating = null,
	size = "md",
	long = false,
	className,
	style,
	...props
}: {
	rating?: string | null;
	size?: keyof typeof SIZES;
	long?: boolean;
} & HTMLAttributes<HTMLSpanElement>) {
	const t = rating ? TIERS[rating] : undefined;

	let css: CSSProperties;
	if (!t) {
		css = {
			background: "var(--secondary)",
			color: "var(--muted-fg)",
			boxShadow: "inset 0 0 0 1px var(--border)",
		};
	} else if (t.solid) {
		css = { background: t.color, color: "#fff" };
	} else {
		css = {
			background: `color-mix(in srgb, ${t.color} 14%, transparent)`,
			color: `color-mix(in srgb, ${t.color} 78%, black)`,
		};
	}

	return (
		<span
			title={props.title ?? (t ? t.desc : "Not yet rated against the National Quality Standard.")}
			className={cn(
				"inline-flex items-center font-sans font-semibold leading-[1.3] rounded-full whitespace-nowrap",
				SIZES[size],
				className,
			)}
			style={{ ...css, ...style }}
			{...props}
		>
			{t?.solid && (
				<Icon name="sparkles" size={size === "lg" ? 16 : 14} style={{ color: "#ffd766" }} />
			)}
			{t ? (long ? t.long : t.label) : "Not yet rated"}
		</span>
	);
}
