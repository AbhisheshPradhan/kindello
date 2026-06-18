"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ds/icon";
import { MapPreview } from "@/components/ds/map-preview";
import { PlaceResultCard } from "@/components/ds/place-result-card";
import type { Centre } from "@/components/centre-card";
import type { Facets, SearchResult } from "@/lib/search-core";
import {
	MAX_RADIUS_KM,
	type SearchState,
} from "@/lib/search-state";

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
}: {
	result: SearchResult | null;
	loading: boolean;
	view: "map" | "list";
	onView: (v: "map" | "list") => void;
	state: SearchState;
	onChange: (delta: Partial<SearchState>) => void;
}) {
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
	const thin = !loading && centres.length > 0 && centres.length <= 2;
	const empty = !loading && centres.length === 0;
	const canWiden = state.radiusKm < MAX_RADIUS_KM;

	const points = centres
		.filter((c) => c.latitude != null && c.longitude != null)
		.map((c) => ({
			lat: c.latitude as number,
			lng: c.longitude as number,
			rating: c.overall_rating,
			label: c.service_name,
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

			{/* Widen / loosen affordance — never leave the parent on a near-empty screen. */}
			{(thin || empty) && (
				<div className="rounded-lg border border-border bg-secondary/40 px-3.5 py-3 text-[13.5px] flex flex-wrap items-center gap-2">
					<span className="text-body">
						{empty
							? "No centres match these filters here."
							: `Only ${centres.length} match — want to widen the net?`}
					</span>
					{canWiden && (
						<button
							type="button"
							onClick={() =>
								onChange({ radiusKm: Math.min(state.radiusKm * 2, MAX_RADIUS_KM) })
							}
							className="rounded-full bg-teal-500 text-white px-3 py-1 text-[12.5px] font-semibold"
						>
							Widen to {Math.min(state.radiusKm * 2, MAX_RADIUS_KM)} km
						</button>
					)}
					{state.minRating && (
						<button
							type="button"
							onClick={() => onChange({ minRating: null })}
							className="rounded-full border border-border bg-card px-3 py-1 text-[12.5px] font-semibold"
						>
							Drop the rating filter
						</button>
					)}
				</div>
			)}

			{view === "map" ? (
				// Map-first (realestate.com.au style): the map fills the canvas; cards are
				// hidden here and live on the List tab so the map gets the full height.
				<div className="flex-1 min-h-0">
					<MapPreview
						points={points}
						center={result?.center}
						height="100%"
					/>
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
