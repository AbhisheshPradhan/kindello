"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, ReactNode } from "react";

export type MapPoint = {
	lat: number;
	lng: number;
	rating?: number | string | null;
	label?: string;
	// Optional details for the click-to-open pin card (Finder map).
	address?: string | null;
	serviceType?: string | null;
	hours?: string | null;
	id?: string;
};

// A map viewport expressed as a centre + covering radius (km) — emitted for "Search this area".
export type MapRegion = { lat: number; lng: number; radiusKm: number };

/**
 * Real map (Mapbox GL) — lazy-loaded so mapbox-gl + its CSS only ship when a
 * token is present. `ssr: false` because mapbox-gl touches `window`.
 */
const MapboxMap = dynamic(() => import("./mapbox-map"), { ssr: false });

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * MapPreview — renders a real Mapbox GL map when NEXT_PUBLIC_MAPBOX_TOKEN is
 * set, otherwise falls back to a styled placeholder (warm teal wash + faint
 * road grid + rating pins) so nothing breaks locally without a token. The
 * MapPoint/props API is identical for both paths, so callers never change.
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

export function pinTone(rating?: number | string | null): string {
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
	center,
	height = 220,
	rounded = "var(--radius-xl)",
	showLabels = false,
	interactive = false,
	onRegionChange,
	children,
	style,
}: {
	points?: MapPoint[];
	/**
	 * Anchor the view here (the searched suburb centroid) instead of the pin
	 * centroid: keeps the suburb dead-center and zooms to the tightest level
	 * that still shows every pin. Omit to fall back to fitting the pins.
	 */
	center?: { lat: number; lng: number } | null;
	height?: number | string;
	rounded?: string;
	showLabels?: boolean;
	/** Opt-in (Finder): pin states + click-to-open PinCard popup + visited tracking. */
	interactive?: boolean;
	/** Opt-in (Finder): emits the map region on user pan/zoom for "Search this area". */
	onRegionChange?: (region: MapRegion | null) => void;
	/** Floating overlay (e.g. result cards in the Answer preview). */
	children?: ReactNode;
	style?: CSSProperties;
}) {
	const placed = normalise(points);
	const useMapbox = Boolean(MAPBOX_TOKEN) && placed.length > 0;
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
			{useMapbox ? (
				<MapboxMap
					points={points}
					center={center}
					interactive={interactive}
					onRegionChange={onRegionChange}
				/>
			) : (
				<MapPlaceholder
					placed={placed}
					showLabels={showLabels}
				/>
			)}

			{children}
		</div>
	);
}

/** The styled stand-in: warm teal wash + faint road grid + rating pins. */
function MapPlaceholder({
	placed,
	showLabels,
}: {
	placed: { x: number; y: number; p: MapPoint }[];
	showLabels: boolean;
}) {
	return (
		<>
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
						className="flex items-center justify-center w-5.5 h-5.5 border-2 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-[0_2px_5px_rgba(0,0,0,.28)]"
						style={{ background: pinTone(p.rating) }}
					>
						<span className="w-1.5 h-1.5 rounded-full bg-white rotate-45" />
					</span>
				</span>
			))}
		</>
	);
}
