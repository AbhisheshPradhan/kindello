"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useTheme } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";
import { type MapPoint, type MapRegion } from "./map-preview";
import { pinSvg, type PinState } from "./rating-pin";
import { PinCard } from "@/components/finder/pin-card";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Mapbox Standard — the full-colour vector basemap. One style for both themes:
 * we switch its `lightPreset` config (`day`/`night`) to follow next-themes.
 */
const STYLE_STANDARD = "mapbox://styles/mapbox/standard";

function isValid(p: MapPoint) {
	return Number.isFinite(p.lat) && Number.isFinite(p.lng);
}

// Radius the Finder clamps "Search this area" to (km) — beyond this zoom-out we don't
// offer an area search (childcare is local; searching half a state is meaningless).
const MAX_AREA_RADIUS_KM = 30;

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
	const R = 6371;
	const dLat = ((bLat - aLat) * Math.PI) / 180;
	const dLng = ((bLng - aLng) * Math.PI) / 180;
	const la1 = (aLat * Math.PI) / 180;
	const la2 = (bLat * Math.PI) / 180;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

// The pin SVG + tier styling live in the reusable ./rating-pin module.
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

type GlMap = import("mapbox-gl").Map;
type Mapboxgl = typeof import("mapbox-gl").default;

// Fit the view to the points: symmetric bounds about the anchor (so the searched suburb
// stays dead-centre and no outlier is clipped), else fit the raw pin cluster.
function fitToPoints(
	map: GlMap,
	mapboxgl: Mapboxgl,
	valid: MapPoint[],
	anchor: { lat: number; lng: number } | null,
) {
	if (!valid.length) return;
	if (anchor) {
		let dLat = 0;
		let dLng = 0;
		for (const p of valid) {
			dLat = Math.max(dLat, Math.abs(p.lat - anchor.lat));
			dLng = Math.max(dLng, Math.abs(p.lng - anchor.lng));
		}
		if (dLat < 1e-4 && dLng < 1e-4) {
			map.setCenter([anchor.lng, anchor.lat]);
			map.setZoom(14);
		} else {
			map.fitBounds(
				new mapboxgl.LngLatBounds(
					[anchor.lng - dLng, anchor.lat - dLat],
					[anchor.lng + dLng, anchor.lat + dLat],
				),
				{ padding: { top: 72, bottom: 56, left: 56, right: 56 }, maxZoom: 15, duration: 0 },
			);
		}
	} else if (valid.length === 1) {
		map.setCenter([valid[0].lng, valid[0].lat]);
		map.setZoom(15);
	} else {
		const bounds = new mapboxgl.LngLatBounds();
		for (const p of valid) bounds.extend([p.lng, p.lat]);
		map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
	}
}

/**
 * MapboxMap — the real-map layer rendered by {@link MapPreview} when a token is set.
 * The map instance is created ONCE; subsequent point/filter changes only swap the
 * markers (no teardown/flicker). Finder extras (popup, states, visited, Search-this-area)
 * are opt-in via `interactive` / `onRegionChange`.
 */
export default function MapboxMap({
	points = [],
	center,
	interactive = false,
	onRegionChange,
}: {
	points?: MapPoint[];
	center?: { lat: number; lng: number } | null;
	/** Finder opt-in: pin hover/selected/visited states + click-to-open PinCard popup. */
	interactive?: boolean;
	/** Finder opt-in: emits the map region on user pan/zoom for "Search this area" (null = hide). */
	onRegionChange?: (region: MapRegion | null) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { resolvedTheme } = useTheme();

	// Persisted-across-renders handles (the map lives for the component's whole lifetime).
	const mapRef = useRef<GlMap | null>(null);
	const glRef = useRef<Mapboxgl | null>(null);
	const markersRef = useRef<import("mapbox-gl").Marker[]>([]);
	const popupRef = useRef<import("mapbox-gl").Popup | null>(null);
	const cardRootRef = useRef<Root | null>(null);
	const selectedRef = useRef<{ id?: string; el: HTMLElement; p: MapPoint } | null>(null);
	const switchingRef = useRef(false);
	const viewedRef = useRef<Set<string>>(new Set());
	const firstFitRef = useRef(false);
	// "Search this area" baseline = the last searched view; reset after each fit.
	const baseCenterRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
	const baseRadiusRef = useRef(0);
	// Read theme/handler via refs so they don't force a map rebuild.
	const themeRef = useRef(resolvedTheme);
	themeRef.current = resolvedTheme;
	const onRegionChangeRef = useRef(onRegionChange);
	onRegionChangeRef.current = onRegionChange;

	const [ready, setReady] = useState(false);

	const valid = points.filter(isValid);
	const anchor =
		center && Number.isFinite(center.lat) && Number.isFinite(center.lng) ? center : null;
	// Markers re-render only when the points or anchor actually change.
	const ptsKey =
		valid
			.map((p) => `${p.lat},${p.lng},${p.rating ?? ""},${p.id ?? ""}`)
			.join("|") + `;c=${anchor ? `${anchor.lat},${anchor.lng}` : ""}`;

	const baseState = useCallback(
		(p: MapPoint): PinState =>
			p.id && viewedRef.current.has(p.id) ? "visited" : "default",
		[],
	);

	const deselect = useCallback(
		(markVisited: boolean) => {
			const s = selectedRef.current;
			if (!s) return;
			if (markVisited && s.id) {
				viewedRef.current.add(s.id);
				persistViewed(viewedRef.current);
			}
			renderPin(s.el, s.p, baseState(s.p));
			selectedRef.current = null;
		},
		[baseState],
	);

	// ---- create the map ONCE ----
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !TOKEN) return;
		let cancelled = false;

		(async () => {
			const mapboxgl = (await import("mapbox-gl")).default;
			if (cancelled || !containerRef.current) return;
			glRef.current = mapboxgl;
			mapboxgl.accessToken = TOKEN;

			const map = new mapboxgl.Map({
				container,
				style: STYLE_STANDARD,
				attributionControl: false,
				cooperativeGestures: false,
			});
			mapRef.current = map;

			map.on("style.load", () => {
				map.setConfigProperty(
					"basemap",
					"lightPreset",
					themeRef.current === "dark" ? "night" : "day",
				);
				map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
				map.setConfigProperty("basemap", "show3dObjects", false);
			});
			map.addControl(new mapboxgl.AttributionControl({ compact: true }));
			// Flat, north-up 2D — no rotation/pitch/3D.
			map.dragRotate.disable();
			map.touchZoomRotate.disableRotation();
			map.touchPitch.disable();
			map.setMaxPitch(0);

			if (interactive) {
				viewedRef.current = loadViewed();
				const popup = new mapboxgl.Popup({
					offset: 44, // clears the larger selected pin
					closeButton: true,
					closeOnClick: true,
					maxWidth: "280px",
					className: "kindello-pin-popup",
				});
				popupRef.current = popup;
				popup.on("close", () => {
					if (switchingRef.current) return; // pin-to-pin swap, not a real dismissal
					deselect(true);
					const root = cardRootRef.current;
					cardRootRef.current = null;
					if (root) setTimeout(() => root.unmount(), 0);
				});
			}

			if (onRegionChangeRef.current) {
				const viewportRadiusKm = () => {
					const b = map.getBounds();
					if (!b) return 0;
					const c = map.getCenter();
					const ne = b.getNorthEast();
					return haversineKm(c.lat, c.lng, ne.lat, ne.lng);
				};
				map.on("moveend", (e) => {
					if (!e.originalEvent) return; // ignore programmatic fit/setCenter
					const r = viewportRadiusKm();
					if (r > MAX_AREA_RADIUS_KM) {
						onRegionChangeRef.current?.(null); // too zoomed out — don't offer
						return;
					}
					const c = map.getCenter();
					const moved = haversineKm(
						baseCenterRef.current.lat,
						baseCenterRef.current.lng,
						c.lat,
						c.lng,
					);
					const zoomChanged =
						baseRadiusRef.current > 0 &&
						Math.abs(r - baseRadiusRef.current) / baseRadiusRef.current > 0.25;
					if (moved < r * 0.3 && !zoomChanged) {
						onRegionChangeRef.current?.(null);
						return;
					}
					onRegionChangeRef.current?.({
						lat: c.lat,
						lng: c.lng,
						radiusKm: Math.max(1, Math.min(MAX_AREA_RADIUS_KM, Math.round(r))),
					});
				});
			}

			map.on("load", () => {
				if (!cancelled) setReady(true);
			});
		})();

		return () => {
			cancelled = true;
			for (const m of markersRef.current) m.remove();
			markersRef.current = [];
			const root = cardRootRef.current;
			cardRootRef.current = null;
			if (root) setTimeout(() => root.unmount(), 0); // React forbids unmount mid-render
			popupRef.current?.remove();
			popupRef.current = null;
			mapRef.current?.remove();
			mapRef.current = null;
			setReady(false);
		};
	}, [interactive, deselect]);

	// ---- follow the app theme without rebuilding the map ----
	useEffect(() => {
		const map = mapRef.current;
		if (!ready || !map) return;
		try {
			map.setConfigProperty(
				"basemap",
				"lightPreset",
				resolvedTheme === "dark" ? "night" : "day",
			);
		} catch {
			/* style not ready yet — style.load handler covers the initial set */
		}
	}, [resolvedTheme, ready]);

	// ---- swap markers when the points change (NO map teardown = no flicker) ----
	useEffect(() => {
		const map = mapRef.current;
		const mapboxgl = glRef.current;
		if (!ready || !map || !mapboxgl) return;

		// Close any open popup and clear the old markers.
		popupRef.current?.remove();
		selectedRef.current = null;
		for (const m of markersRef.current) m.remove();
		markersRef.current = [];

		const popup = popupRef.current;
		for (const p of valid) {
			const el = document.createElement("div");
			el.className = interactive ? "cursor-pointer" : "";
			if (p.label) el.title = p.label;
			renderPin(el, p, baseState(p));

			const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
				.setLngLat([p.lng, p.lat])
				.addTo(map);
			markersRef.current.push(marker);

			if (!interactive || !popup) continue;

			el.addEventListener("mouseenter", () => {
				if (selectedRef.current?.el === el) return;
				renderPin(el, p, "hover");
			});
			el.addEventListener("mouseleave", () => {
				if (selectedRef.current?.el === el) return;
				renderPin(el, p, baseState(p));
			});
			el.addEventListener("click", (e) => {
				e.stopPropagation();
				if (selectedRef.current?.el === el) return; // already open
				deselect(true); // previous open pin becomes visited
				selectedRef.current = { id: p.id, el, p };
				renderPin(el, p, "selected");

				const container = document.createElement("div");
				cardRootRef.current?.unmount();
				cardRootRef.current = createRoot(container);
				cardRootRef.current.render(<PinCard p={p} />);
				switchingRef.current = true; // guard the close from addTo()'s internal remove()
				popup.setLngLat([p.lng, p.lat]).setDOMContent(container).addTo(map);
				switchingRef.current = false;
			});
		}

		// Recenter ONLY on first load or a genuinely new location (typed suburb / AI).
		// "Search this area" sets the anchor to the current map centre, so we don't refit
		// then — the pins just repopulate and the camera stays put (no jump).
		const cur = map.getCenter();
		const movedFar = anchor
			? haversineKm(anchor.lat, anchor.lng, cur.lat, cur.lng) > 1.5
			: false;
		if (!firstFitRef.current || movedFar) {
			fitToPoints(map, mapboxgl, valid, anchor);
			firstFitRef.current = true;
		}

		// Reset the Search-this-area baseline to the current (searched) view.
		const c2 = map.getCenter();
		const b2 = map.getBounds();
		baseCenterRef.current = { lat: c2.lat, lng: c2.lng };
		baseRadiusRef.current = b2
			? haversineKm(c2.lat, c2.lng, b2.getNorthEast().lat, b2.getNorthEast().lng)
			: 0;
	}, [ready, ptsKey, interactive, anchor, baseState, deselect]);

	return (
		// h-full w-full: mapbox-gl forces `.mapboxgl-map { position: relative }`, which
		// overrides Tailwind `absolute` and collapses inset-0 to height 0.
		<div
			ref={containerRef}
			role="img"
			aria-label="Map of nearby childcare centres"
			className="h-full w-full"
		/>
	);
}
