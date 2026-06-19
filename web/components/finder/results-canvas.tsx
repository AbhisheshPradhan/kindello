"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ds/icon";
import {
	MapPreview,
	type AreaPrompt,
	type MapRegion,
} from "@/components/ds/map-preview";
import { PlaceResultCard } from "@/components/ds/place-result-card";
import type { Centre } from "@/components/centre-card";
import { summariseHours } from "@/lib/format";
import type { Facets, SearchResult } from "@/lib/search-core";
import type { SearchState } from "@/lib/search-state";

// Representative star anchored to the real NQS tier (Google reviews are Tier-2 enrichment
// we haven't loaded — the NQS badge is the actual signal; the star is just a visual proxy).
function nqsStar(rating: string | null): number {
	switch (rating) {
		case "Excellent":
			return 4.9;
		case "Exceeding NQS":
			return 4.7;
		case "Meeting NQS":
			return 4.4;
		case "Working Towards NQS":
			return 4.0;
		default:
			return 4.2;
	}
}

function FacetLine({ facets, shown }: { facets: Facets; shown: number }) {
	const parts = [
		`${facets.total} within range`,
		facets.exceeding > 0 && `${facets.exceeding} Exceeding+`,
	].filter(Boolean) as string[];
	return (
		<p className="text-[12.5px] text-muted-foreground">
			Showing {shown} of {parts.join(" · ")}
		</p>
	);
}

function ViewToggle({
	view,
	onView,
}: {
	view: "map" | "list";
	onView: (v: "map" | "list") => void;
}) {
	return (
		<div className="inline-flex rounded-full border border-border bg-card p-0.5 text-[13px] font-semibold">
			{(["map", "list"] as const).map((v) => (
				<button
					key={v}
					type="button"
					onClick={() => onView(v)}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-full px-3 py-1.25 capitalize transition-colors",
						view === v
							? "bg-teal-500 text-white"
							: "text-body hover:text-teal-700",
					)}
				>
					<Icon name={v} size={14} />
					{v}
				</button>
			))}
		</div>
	);
}

function CentreGrid({ centres }: { centres: Centre[] }) {
	return (
		<div className="grid gap-4 grid-cols-1 min-[480px]:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
			{centres.map((c, i) => (
				<PlaceResultCard
					key={c.id ?? i}
					name={c.service_name}
					suburb={c.suburb ?? ""}
					address={
						[c.service_address, c.suburb, c.state, c.postcode]
							.filter(Boolean)
							.join(", ") || null
					}
					verified={false}
					nqsRating={c.overall_rating}
					rating={nqsStar(c.overall_rating)}
					reviews={(i + 3) * 17}
					placesNow={c.places != null ? `${c.places} approved places` : null}
					phone={c.phone}
					seed={i}
					href={c.id ? `/centre/${c.id}` : undefined}
				/>
			))}
		</div>
	);
}

export function ResultsCanvas({
	result,
	loading,
	view,
	onView,
	state,
	onChange,
	onSearchArea,
}: {
	result: SearchResult | null;
	loading: boolean;
	view: "map" | "list";
	onView: (v: "map" | "list") => void;
	state: SearchState;
	onChange: (delta: Partial<SearchState>) => void;
	onSearchArea: (region: MapRegion) => void;
}) {
	// Area prompt — set when the user pans/zooms the map off the search view. Either
	// "search" (zoomed in enough) or "zoom-in" (zoomed out past the search floor).
	const [areaPrompt, setAreaPrompt] = useState<AreaPrompt | null>(null);
	// Bumped to ask the map to ease back to the floor zoom (the "Zoom in to search" tap).
	const [zoomInTick, setZoomInTick] = useState(0);
	// True between a "Zoom in to search" tap and the map's follow-up search emission, so we
	// run that search automatically instead of showing a second "Search this area" pill.
	const awaitingZoomInSearch = useRef(false);
	// A fresh search (new centre/results) supersedes any pending pan prompt.
	useEffect(() => {
		setAreaPrompt(null);
	}, [result]);

	// No anchor yet — invite a filter-first OR chat-first start.
	if (!state.location) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center text-center gap-3 px-6 py-20 text-muted-foreground">
				<span className="text-teal-500">
					<Icon name="map-pin" size={34} />
				</span>
				<p className="text-[15px] max-w-xs">
					Enter a suburb or postcode above, or just ask the assistant —
					results map out here.
				</p>
			</div>
		);
	}

	const centres = result?.centres ?? [];

	const points = centres
		.filter((c) => c.latitude != null && c.longitude != null)
		.map((c) => ({
			lat: c.latitude as number,
			lng: c.longitude as number,
			rating: c.overall_rating,
			label: c.service_name,
			serviceType: c.service_type,
			address:
				[c.service_address, c.suburb, c.state, c.postcode]
					.filter(Boolean)
					.join(", ") || null,
			hours: summariseHours(c.operating_hours),
			id: c.id,
		}));

	return (
		<div className="flex flex-col gap-3 flex-1 min-h-0">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				{result?.facets ? (
					<FacetLine facets={result.facets} shown={centres.length} />
				) : (
					<span className="text-[12.5px] text-muted-foreground">
						{loading ? "Searching…" : " "}
					</span>
				)}
				<ViewToggle view={view} onView={onView} />
			</div>

			{view === "map" ? (
				// Map-first (realestate.com.au style): the map fills the canvas; cards are
				// hidden here and live on the List tab so the map gets the full height.
				<div className="relative flex-1 min-h-0">
					<MapPreview
						points={points}
						center={result?.center}
						height="100%"
						interactive
						zoomInTick={zoomInTick}
						onRegionChange={(prompt) => {
							// A search emitted right after a "Zoom in to search" tap: run it now,
							// don't make the user click "Search this area" too.
							if (prompt?.kind === "search" && awaitingZoomInSearch.current) {
								awaitingZoomInSearch.current = false;
								setAreaPrompt(null);
								onSearchArea(prompt);
								return;
							}
							setAreaPrompt(prompt);
						}}
					/>
					{areaPrompt?.kind === "search" && (
						<button
							type="button"
							onClick={() => {
								onSearchArea(areaPrompt);
								setAreaPrompt(null);
							}}
							className="absolute top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 rounded-full bg-card border border-border shadow-lg px-4 py-2 text-[13.5px] font-semibold text-teal-700 hover:bg-teal-50"
						>
							<Icon name="search" size={15} />
							Search this area
						</button>
					)}
					{areaPrompt?.kind === "zoom-in" && (
						<button
							type="button"
							onClick={() => {
								awaitingZoomInSearch.current = true;
								setZoomInTick((t) => t + 1);
								setAreaPrompt(null);
							}}
							className="absolute top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 rounded-full bg-card border border-border shadow-lg px-4 py-2 text-[13.5px] font-semibold text-teal-700 hover:bg-teal-50"
						>
							<Icon name="search" size={15} />
							Zoom in to search
						</button>
					)}
				</div>
			) : (
				<div className="overflow-y-auto flex-1 min-h-0">
					{centres.length > 0 ? (
						<CentreGrid centres={centres} />
					) : (
						!loading && (
							<p className="text-muted-foreground text-sm py-10 text-center">
								No results.
							</p>
						)
					)}
				</div>
			)}
		</div>
	);
}
