"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";
import { type MapPoint, pinTone } from "./map-preview";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Mapbox Standard — the full-colour vector basemap (green parks, blue water,
 * coloured roads/labels). One style for both themes: we switch its `lightPreset`
 * config (`day`/`night`) to follow next-themes instead of swapping styles. Left
 * untinted — brand identity lives in the teal pins, not the basemap.
 */
const STYLE_STANDARD = "mapbox://styles/mapbox/standard";

function isValid(p: MapPoint) {
	return Number.isFinite(p.lat) && Number.isFinite(p.lng);
}

/** Build a teardrop pin matching the placeholder's pins (same Tailwind classes). */
// A small card shown when a pin is clicked: name, type, NQS rating, address, link.
// Built via DOM (not innerHTML) so centre names can't inject markup.
function makePinCard(p: MapPoint): HTMLElement {
	const card = document.createElement("div");
	card.className = "w-56 font-sans";

	const name = document.createElement("div");
	name.className = "font-semibold text-[13.5px] leading-snug text-foreground";
	name.textContent = p.label ?? "Centre";
	card.appendChild(name);

	if (p.serviceType) {
		const type = document.createElement("div");
		type.className = "text-[11.5px] text-muted-foreground mt-0.5";
		type.textContent = p.serviceType;
		card.appendChild(type);
	}

	if (typeof p.rating === "string" && p.rating) {
		const badge = document.createElement("div");
		badge.className =
			"inline-flex items-center gap-1.25 mt-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-secondary text-body";
		const dot = document.createElement("span");
		dot.className = "w-2 h-2 rounded-full";
		dot.style.background = pinTone(p.rating);
		badge.appendChild(dot);
		badge.appendChild(document.createTextNode(p.rating));
		card.appendChild(badge);
	}

	if (p.address) {
		const addr = document.createElement("div");
		addr.className = "text-[11.5px] text-muted-foreground mt-1.5 leading-snug";
		addr.textContent = p.address;
		card.appendChild(addr);
	}

	if (p.id) {
		const link = document.createElement("a");
		link.href = `/centre/${p.id}`;
		link.className =
			"mt-2 inline-block text-[12px] font-semibold text-teal-700 hover:underline";
		link.textContent = "More info →";
		card.appendChild(link);
	}
	return card;
}

function makePin(p: MapPoint, showLabels: boolean): HTMLElement {
	const wrap = document.createElement("div");
	wrap.className = "flex flex-col items-center cursor-pointer";
	// Name stays discoverable on hover even when labels are off, without cluttering the map.
	if (p.label) wrap.title = p.label;

	if (showLabels && p.label) {
		const label = document.createElement("span");
		label.className =
			"mb-1 px-1.75 py-0.5 text-[11px] font-semibold whitespace-nowrap text-foreground bg-card rounded-full shadow-sm";
		label.textContent = p.label;
		wrap.appendChild(label);
	}

	const pin = document.createElement("span");
	// Sharp corner is bottom-left (border-radius 0 there); rotate -45deg so the point
	// faces straight DOWN onto the coordinate (the marker anchor is "bottom").
	pin.className =
		"flex items-center justify-center w-5.5 h-5.5 border-2 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-[0_2px_5px_rgba(0,0,0,.28)]";
	pin.style.background = pinTone(p.rating);

	const dot = document.createElement("span");
	dot.className = "w-1.5 h-1.5 rounded-full bg-white rotate-45";
	pin.appendChild(dot);
	wrap.appendChild(pin);

	return wrap;
}

/**
 * MapboxMap — the real-map layer rendered by {@link MapPreview} when
 * NEXT_PUBLIC_MAPBOX_TOKEN is set. Fills its (sized) parent, fits the view to
 * the points, and drops teal rating markers (reusing `pinTone`). Lazy-loaded
 * via `next/dynamic` so mapbox-gl + its CSS never ship unless a token is present.
 */
export default function MapboxMap({
	points = [],
	center,
	showLabels = false,
}: {
	points?: MapPoint[];
	center?: { lat: number; lng: number } | null;
	showLabels?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { resolvedTheme } = useTheme();

	const valid = points.filter(isValid);
	const anchor =
		center && Number.isFinite(center.lat) && Number.isFinite(center.lng)
			? center
			: null;
	// Re-init the map only when the points, anchor, or theme actually change.
	const ptsKey =
		valid
			.map((p) => `${p.lat},${p.lng},${p.rating ?? ""},${p.label ?? ""}`)
			.join("|") + `;c=${anchor ? `${anchor.lat},${anchor.lng}` : ""}`;

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !TOKEN || !valid.length) return;

		let cancelled = false;
		// mapbox map + markers are created in the async block; typed loosely here.
		let map: import("mapbox-gl").Map | undefined;
		let markers: import("mapbox-gl").Marker[] = [];

		(async () => {
			const mapboxgl = (await import("mapbox-gl")).default;
			if (cancelled || !containerRef.current) return;
			mapboxgl.accessToken = TOKEN;

			map = new mapboxgl.Map({
				container,
				style: STYLE_STANDARD,
				attributionControl: false,
				// Plain wheel-zoom (no modifier key): the wheel zooms the map
				// directly. Trade-off — while the pointer is over the map the
				// page won't scroll. Pinch-zoom on touch works regardless.
				cooperativeGestures: false,
			});
			// Match the basemap to the app theme via Standard's day/night light
			// preset, and hide POI labels (restaurants/cafes/attractions) so they
			// don't compete with our childcare pins — keep place/road labels for
			// orientation. Set once the Standard style + its config are loaded.
			map.on("style.load", () => {
				map!.setConfigProperty(
					"basemap",
					"lightPreset",
					resolvedTheme === "dark" ? "night" : "day",
				);
				map!.setConfigProperty("basemap", "showPointOfInterestLabels", false);
				// Flat 2D — no 3D buildings (keep the map calm and legible).
				map!.setConfigProperty("basemap", "show3dObjects", false);
			});
			map.addControl(new mapboxgl.AttributionControl({ compact: true }));

			// Keep it simple: a flat, north-up 2D map. No rotation, no pitch/3D tilt.
			map.dragRotate.disable();
			map.touchZoomRotate.disableRotation();
			map.touchPitch.disable();
			map.setMaxPitch(0);

			// One reused popup — clicking a pin opens its card; clicking another moves it.
			const popup = new mapboxgl.Popup({
				offset: 26,
				closeButton: true,
				closeOnClick: true,
				maxWidth: "260px",
			});

			for (const p of valid) {
				const el = makePin(p, showLabels);
				const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
					.setLngLat([p.lng, p.lat])
					.addTo(map);
				el.addEventListener("click", (e) => {
					e.stopPropagation();
					popup
						.setLngLat([p.lng, p.lat])
						.setDOMContent(makePinCard(p))
						.addTo(map!);
				});
				markers.push(marker);
			}

			if (anchor) {
				// Keep the searched suburb dead-center and zoom to the tightest
				// level that still shows every pin: build bounds SYMMETRIC about
				// the anchor (its centroid is therefore the anchor) so fitBounds
				// neither drifts toward the pin cluster nor clips an outlier.
				let dLat = 0;
				let dLng = 0;
				for (const p of valid) {
					dLat = Math.max(dLat, Math.abs(p.lat - anchor.lat));
					dLng = Math.max(dLng, Math.abs(p.lng - anchor.lng));
				}
				if (dLat < 1e-4 && dLng < 1e-4) {
					// Degenerate (suburb-only fallback pin, or all pins on the
					// suburb): nothing to fit — land at a neighbourhood zoom.
					map.setCenter([anchor.lng, anchor.lat]);
					map.setZoom(14);
				} else {
					const bounds = new mapboxgl.LngLatBounds(
						[anchor.lng - dLng, anchor.lat - dLat],
						[anchor.lng + dLng, anchor.lat + dLat],
					);
					map.fitBounds(bounds, {
						// Extra top padding: pins (label + teardrop) extend
						// upward from their coordinate, so the top edge needs
						// more room than the rest to avoid clipping.
						padding: { top: 72, bottom: 56, left: 56, right: 56 },
						maxZoom: 15,
						duration: 0,
					});
				}
			} else if (valid.length === 1) {
				map.setCenter([valid[0].lng, valid[0].lat]);
				map.setZoom(15);
			} else {
				const bounds = new mapboxgl.LngLatBounds();
				for (const p of valid) bounds.extend([p.lng, p.lat]);
				map.fitBounds(bounds, {
					padding: 56,
					maxZoom: 15,
					duration: 0,
				});
			}
		})();

		return () => {
			cancelled = true;
			for (const m of markers) m.remove();
			markers = [];
			if (map) map.remove();
		};
	}, [ptsKey, resolvedTheme, showLabels]);

	return (
		// h-full w-full (not absolute inset-0): mapbox-gl's own CSS forces
		// `.mapboxgl-map { position: relative }`, which overrides Tailwind's
		// `absolute` and collapses an inset-0 box to height 0. A relative box
		// with h-full fills the parent's definite height instead.
		<div
			ref={containerRef}
			// Supplementary view — the same centres are listed as text cards, so
			// label the region rather than expecting SR users to navigate the canvas.
			role="img"
			aria-label="Map of nearby childcare centres"
			className="h-full w-full"
		/>
	);
}
