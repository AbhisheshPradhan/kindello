"use client";

import type { CSSProperties, ReactNode } from "react";

export type MapPoint = {
	lat: number;
	lng: number;
	rating?: number | string | null;
	label?: string;
};

/**
 * MapPreview — a styled map stand-in with teal rating pins, positioned from
 * real lat/lng. The design system ships map *placeholders*; this keeps that
 * look (warm teal wash + faint road grid + pins) until a Mapbox token is wired.
 *
 * PRODUCTION SWAP → Mapbox GL:
 *   Set NEXT_PUBLIC_MAPBOX_TOKEN, `npm i mapbox-gl`, and replace the placeholder
 *   block below with a <Map> initialised to fitBounds(points) using a light
 *   street style, dropping teal rating markers at each [lng, lat]. The pin /
 *   bounds maths here (normalise()) ports directly to marker placement.
 */
function normalise(
	points: MapPoint[],
): { x: number; y: number; p: MapPoint }[] {
	const valid = points.filter(
		(p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
	);
	if (!valid.length) return [];
	const lats = valid.map((p) => p.lat);
	const lngs = valid.map((p) => p.lng);
	let minLat = Math.min(...lats),
		maxLat = Math.max(...lats),
		minLng = Math.min(...lngs),
		maxLng = Math.max(...lngs);
	// Pad degenerate (single-point / colinear) bounds so pins don't pile in a corner.
	const padLat = Math.max((maxLat - minLat) * 0.25, 0.01);
	const padLng = Math.max((maxLng - minLng) * 0.25, 0.01);
	minLat -= padLat;
	maxLat += padLat;
	minLng -= padLng;
	maxLng += padLng;
	return valid.map((p) => ({
		x: ((p.lng - minLng) / (maxLng - minLng)) * 100,
		y: (1 - (p.lat - minLat) / (maxLat - minLat)) * 100, // invert: north = up
		p,
	}));
}

function pinTone(rating?: number | string | null): string {
	if (typeof rating === "string") {
		if (rating === "Excellent" || rating === "Exceeding NQS")
			return "var(--teal-500)";
		if (rating === "Meeting NQS") return "var(--rating-meeting)";
		if (rating === "Working Towards NQS") return "var(--rating-working)";
		return "var(--muted-fg)";
	}
	return "var(--teal-500)";
}

export function MapPreview({
	points = [],
	height = 220,
	rounded = "var(--radius-xl)",
	showLabels = false,
	children,
	style,
}: {
	points?: MapPoint[];
	height?: number | string;
	rounded?: string;
	showLabels?: boolean;
	/** Floating overlay (e.g. result cards in the Answer preview). */
	children?: ReactNode;
	style?: CSSProperties;
}) {
	const placed = normalise(points);
	return (
		<div
			aria-hidden={!points.length}
			className="relative w-full overflow-hidden border shadow-sm"
			style={{
				height,
				borderRadius: rounded,
				background:
					"radial-gradient(120% 120% at 80% 10%, color-mix(in srgb, var(--teal-500) 12%, var(--secondary)), var(--secondary))",
				...style,
			}}
		>
			{/* Faint road grid */}
			<svg
				width="100%"
				height="100%"
				className="absolute inset-0 opacity-50"
				aria-hidden
			>
				<defs>
					<pattern
						id="ds-map-grid"
						width="44"
						height="44"
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M44 0 L0 0 0 44"
							fill="none"
							stroke="var(--border)"
							strokeWidth="1"
						/>
					</pattern>
				</defs>
				<rect
					width="100%"
					height="100%"
					fill="url(#ds-map-grid)"
				/>
				<path
					d="M-10 70 Q 30% 40 55% 60 T 110% 50"
					fill="none"
					stroke="var(--surface)"
					strokeWidth="6"
					opacity="0.7"
				/>
				<path
					d="M20% -10 Q 30% 40% 60% 55% T 75% 110%"
					fill="none"
					stroke="var(--surface)"
					strokeWidth="5"
					opacity="0.6"
				/>
			</svg>

			{/* Rating pins */}
			{placed.map(({ x, y, p }, i) => (
				<span
					key={i}
					className="absolute flex flex-col items-center z-2"
					style={{
						left: `${x}%`,
						top: `${y}%`,
						transform: "translate(-50%, -100%)",
					}}
				>
					{showLabels && p.label && (
						<span className="mb-1 px-1.75 py-0.5 text-[11px] font-semibold whitespace-nowrap text-foreground bg-card rounded-full shadow-sm">
							{p.label}
						</span>
					)}
					<span
						className="flex items-center justify-center w-5.5 h-5.5 border-2 border-white rounded-[50%_50%_50%_0] rotate-45 shadow-[0_2px_5px_rgba(0,0,0,.28)]"
						style={{ background: pinTone(p.rating) }}
					>
						<span className="w-1.5 h-1.5 rounded-full bg-white -rotate-45" />
					</span>
				</span>
			))}

			{children}
		</div>
	);
}
