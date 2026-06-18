"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useTheme } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";
import { type MapPoint } from "./map-preview";
import { pinSvg, type PinState } from "./rating-pin";
import { PinCard } from "@/components/finder/pin-card";

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

// The pin SVG + tier styling live in the reusable ./rating-pin module. Here we just paint
// it onto a marker element and manage interaction state.
function renderPin(el: HTMLElement, p: MapPoint, state: PinState) {
	el.innerHTML = pinSvg(p.rating, state);
}

// Viewed centres persist in localStorage so "already looked at" survives filter changes,
// refreshes and sessions. (Clean path to a per-user DB column once accounts exist.)
const VIEWED_KEY = "kindello:viewed";
function loadViewed(): Set<string> {
	try {
		const raw = localStorage.getItem(VIEWED_KEY);
		return new Set(raw ? (JSON.parse(raw) as string[]) : []);
	} catch {
		return new Set();
	}
}
function persistViewed(viewed: Set<string>) {
	try {
		localStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed]));
	} catch {
		/* ignore quota / unavailable */
	}
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
		// React root mounted into the popup card; unmounted on close/content-change/teardown.
		let cardRoot: Root | null = null;

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
				// Clear the SELECTED pin (~44px tall) so the card sits above it and its
				// tip meets the pin head instead of overlapping the larger open-state pin.
				offset: 44,
				closeButton: true,
				closeOnClick: true,
				maxWidth: "280px",
				className: "kindello-pin-popup",
			});

			const viewed = loadViewed();
			// The currently-selected pin (popup open). Cleared/marked-visited on dismiss.
			let selected: { id?: string; el: HTMLElement; p: MapPoint } | null = null;
			// Mapbox's Popup.addTo() calls remove() first (firing "close") when moving an
			// open popup to another pin. This guards that programmatic close so only a REAL
			// dismissal (X / map click / Esc) marks the centre visited.
			let switching = false;

			const baseState = (p: MapPoint): PinState =>
				p.id && viewed.has(p.id) ? "visited" : "default";

			const deselect = (markVisited: boolean) => {
				if (!selected) return;
				if (markVisited && selected.id) {
					viewed.add(selected.id);
					persistViewed(viewed);
				}
				renderPin(selected.el, selected.p, baseState(selected.p));
				selected = null;
			};

			// Dismissing the popup (X, map click, Esc) marks the open centre as visited.
			popup.on("close", () => {
				if (switching) return; // pin-to-pin switch, not a real dismissal
				deselect(true);
				cardRoot?.unmount();
				cardRoot = null;
			});

			for (const p of valid) {
				const el = document.createElement("div");
				el.className = "cursor-pointer";
				if (p.label) el.title = p.label;
				renderPin(el, p, baseState(p));

				const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
					.setLngLat([p.lng, p.lat])
					.addTo(map);

				el.addEventListener("mouseenter", () => {
					if (selected?.el === el) return;
					renderPin(el, p, "hover");
				});
				el.addEventListener("mouseleave", () => {
					if (selected?.el === el) return;
					renderPin(el, p, baseState(p));
				});
				el.addEventListener("click", (e) => {
					e.stopPropagation();
					if (selected?.el === el) return; // already open
					deselect(true); // previous open pin becomes visited
					selected = { id: p.id, el, p };
					renderPin(el, p, "selected");

					const container = document.createElement("div");
					cardRoot?.unmount();
					cardRoot = createRoot(container);
					cardRoot.render(<PinCard p={p} />);
					// Guard the close fired by addTo()'s internal remove() during the swap.
					switching = true;
					popup.setLngLat([p.lng, p.lat]).setDOMContent(container).addTo(map!);
					switching = false;
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
			// Defer unmount: React forbids unmounting a root while React is mid-render.
			if (cardRoot) {
				const root = cardRoot;
				cardRoot = null;
				setTimeout(() => root.unmount(), 0);
			}
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
