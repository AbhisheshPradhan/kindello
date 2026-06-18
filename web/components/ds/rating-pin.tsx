// Reusable rating-tiered map pin. The map renders pins imperatively (Mapbox markers),
// so the source of truth is `pinSvg()` returning an SVG string; `RatingPin` wraps it for
// normal React use (legends, keys, previews). States: default / hover / selected / visited.

export type PinState = "default" | "hover" | "selected" | "visited";

const GOLD = "#f5b125"; // sun-500: Excellent ring + star

// Each NQS tier -> fill colour + whether it's the gold-star "Excellent" tier.
export function pinTier(rating?: number | string | null): {
	fill: string;
	excellent: boolean;
} {
	switch (rating) {
		case "Excellent":
			return { fill: "#1ca6a6", excellent: true };
		case "Exceeding NQS":
			return { fill: "#1ca6a6", excellent: false };
		case "Meeting NQS":
			return { fill: "#2f7fe0", excellent: false };
		case "Working Towards NQS":
			return { fill: "#d68a16", excellent: false };
		case "Significant Improvement Required":
			return { fill: "#d6453f", excellent: false };
		default:
			return { fill: "#8a8f98", excellent: false }; // not yet rated
	}
}

// Classic map-pin teardrop: round head, point at the bottom (tip ~y=31).
const PIN_PATH =
	"M12 1C6 1 1.5 5.6 1.5 11.6c0 7.5 10.5 19.4 10.5 19.4s10.5-11.9 10.5-19.4C22.5 5.6 18 1 12 1z";
// 5-point star centred at the origin (placed at the head via transform).
const STAR_PATH =
	"M0 -10 L2.9 -3.1 L9.5 -3.1 L4.3 1.2 L6.2 8 L0 4 L-6.2 8 L-4.3 1.2 L-9.5 -3.1 L-2.9 -3.1 Z";

export function pinSvg(
	rating: number | string | null | undefined,
	state: PinState = "default",
): string {
	const { fill, excellent } = pinTier(rating);
	const filled = state !== "visited";
	const big = state === "selected" || state === "hover";

	const w = state === "selected" ? 40 : state === "hover" ? 33 : 28;
	const h = Math.round((w * 37) / 34);

	const bodyFill = filled ? fill : "#ffffff";
	// Excellent gets a gold ring when filled; others get a white halo. Visited is hollow
	// (white body, tier-coloured outline) so "already viewed" reads at a glance.
	const stroke = !filled ? fill : excellent ? GOLD : "#ffffff";
	const strokeW = big ? 2.6 : !filled ? 2.2 : 1.8;
	const shadow = big
		? "drop-shadow(0 5px 8px rgba(0,0,0,.32))"
		: "drop-shadow(0 2px 3px rgba(0,0,0,.28))";

	let glyph: string;
	if (excellent) {
		glyph = `<g transform="translate(12 11.6) scale(0.4)"><path d="${STAR_PATH}" fill="${GOLD}"/></g>`;
	} else if (state === "visited") {
		glyph = `<path d="M8.4 11.9l2.4 2.4 4.8-5.1" fill="none" stroke="${fill}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
	} else {
		glyph = `<circle cx="12" cy="11.6" r="3.4" fill="#ffffff"/>`;
	}

	return `<svg width="${w}" height="${h}" viewBox="-5 -5 34 37" style="filter:${shadow};display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="${PIN_PATH}" fill="${bodyFill}" stroke="${stroke}" stroke-width="${strokeW}"/>${glyph}</svg>`;
}

/** React wrapper for non-map use (legend, key, previews). */
export function RatingPin({
	rating = null,
	state = "default",
	className,
}: {
	rating?: number | string | null;
	state?: PinState;
	className?: string;
}) {
	return (
		<span
			className={className}
			// SVG is built from a fixed template + tier colours — no user content.
			dangerouslySetInnerHTML={{ __html: pinSvg(rating, state) }}
		/>
	);
}
