"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
	MapPreview,
	type MapPoint,
	type AreaPrompt,
	type MapRegion,
} from "@/components/ds/map-preview";
import { Icon } from "@/components/ds/icon";
import { CentreListCard } from "./centre-list-card";
import { ResultsToolbar } from "./results-toolbar";
import { summariseHours } from "@/lib/format";
// Types only — lib/directory imports `pg` and must never reach the client bundle.
import type {
	DirectoryCentre,
	SuburbPage,
	SuburbStats,
	SuburbLink,
} from "@/lib/directory";

// Static derived data the server shell computed (so we don't import lib/directory at runtime).
export type CareLink = {
	href: string;
	label: string;
	n: number;
	active: boolean;
};

// Care-type → first tag-style label for the pin card.
function careLabel(c: DirectoryCentre): string {
	if (c.flags.ldc) return "Long day care";
	if (c.flags.preschoolStandalone || c.flags.preschoolSchool)
		return "Preschool";
	if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation)
		return "OSHC";
	if (c.flags.familyDayCare) return "Family day care";
	return "Early learning";
}

function toPoints(centres: DirectoryCentre[]): MapPoint[] {
	return centres
		.filter((c) => c.lat != null && c.lng != null)
		.map((c) => ({
			lat: c.lat as number,
			lng: c.lng as number,
			rating: c.rating,
			label: c.name,
			serviceType: careLabel(c),
			address: [c.address, c.suburb, c.state, c.postcode]
				.filter(Boolean)
				.join(", "),
			hours: summariseHours(c.operatingHours),
			id: c.id,
		}));
}

/**
 * The interactive half of the suburb page (list + map share state). Initial values come
 * from the server-rendered suburb query (SEO baseline); "Search this area" / "Zoom in to
 * search" re-query /api/directory-area at the panned map centre and swap both in place.
 */
export function SuburbResults({
	data,
	nearby,
	suburbSlug,
	rating,
	stateLong,
	heading,
	headingPrefix,
	introSuburb,
	careLinks,
}: {
	data: SuburbPage;
	nearby: SuburbLink[];
	suburbSlug: string;
	rating: string;
	stateLong: string;
	heading: string;
	// "Childcare" or the care-type label — used to build the "… in Map Area" heading.
	headingPrefix: string;
	introSuburb: string;
	careLinks: CareLink[];
}) {
	const [centres, setCentres] = useState<DirectoryCentre[]>(data.centres);
	const [stats, setStats] = useState<SuburbStats>(data.stats);
	const [center, setCenter] = useState(data.center);
	// areaMode = the list/map now reflect a panned map area, not the suburb boundary.
	const [areaMode, setAreaMode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [areaPrompt, setAreaPrompt] = useState<AreaPrompt | null>(null);
	const [zoomInTick, setZoomInTick] = useState(0);
	// True between a "Zoom in to search" tap and the map's follow-up search emission.
	const awaitingZoomInSearch = useRef(false);

	const points = toPoints(centres);

	async function searchArea(region: MapRegion) {
		setLoading(true);
		setAreaPrompt(null);
		try {
			const res = await fetch("/api/directory-area", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					lat: region.lat,
					lng: region.lng,
					radiusKm: region.radiusKm,
					careType: data.careType,
					minRating: rating || null,
				}),
			});
			const json = (await res.json()) as {
				centres?: DirectoryCentre[];
				stats?: SuburbStats;
				center?: { lat: number; lng: number };
			};
			if (Array.isArray(json.centres) && json.stats && json.center) {
				setCentres(json.centres);
				setStats(json.stats);
				setCenter(json.center);
				setAreaMode(true);
			}
		} catch {
			/* network error — keep the current results, drop the prompt */
		} finally {
			setLoading(false);
		}
	}

	function resetToSuburb() {
		setCentres(data.centres);
		setStats(data.stats);
		setCenter(data.center);
		setAreaMode(false);
		setAreaPrompt(null);
	}

	return (
		<>
			{/* Sticky search + filters. In area mode the location reads "Map Area". */}
			<ResultsToolbar
				suburbSlug={suburbSlug}
				postcode={data.postcode}
				state={data.state ?? ""}
				suburbName={data.suburbName}
				careType={data.careType ?? ""}
				rating={rating}
				areaActive={areaMode}
				onClearArea={resetToSuburb}
			/>

			<main className="flex-1">
				<div className="w-full">
					<div className="grid lg:grid-cols-[1fr_minmax(480px,52%)]">
						{/* Left: the scrolling content + list (primary, SEO). */}
						<div className="min-w-0 pt-6 pb-12 px-4 sm:px-6 lg:pl-8 lg:pr-6">
							<nav className="text-[12.5px] text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
								<Link
									href="/"
									className="hover:text-teal-700"
								>
									Home
								</Link>
								<span>/</span>
								{data.state && (
									<>
										<Link
											href={`/childcare/${data.state.toLowerCase()}`}
											className="hover:text-teal-700"
										>
											{stateLong}
										</Link>
										<span>/</span>
									</>
								)}
								<span className="text-body">
									{data.suburbName}
								</span>
							</nav>

							<h1 className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-foreground">
								{areaMode
									? `${headingPrefix} in Map Area`
									: heading}
							</h1>

							{areaMode ? (
								<p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
									Showing {stats.total}{" "}
									{stats.total === 1 ? "centre" : "centres"}{" "}
									in this map area.{" "}
									<button
										type="button"
										onClick={resetToSuburb}
										className="text-teal-700 font-medium hover:underline"
									>
										Back to {data.suburbName}
									</button>
								</p>
							) : (
								<p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
									{introSuburb}
								</p>
							)}

							<div className="mt-5 flex flex-wrap gap-2.5">
								<Stat
									label={`${stats.total} ${stats.total === 1 ? "centre" : "centres"}`}
									icon="map-pin"
								/>
								{stats.exceeding > 0 && (
									<Stat
										label={`${stats.exceeding} Exceeding+`}
										icon="sparkles"
										tone="teal"
									/>
								)}
								{stats.totalPlaces > 0 && (
									<Stat
										label={`${stats.totalPlaces.toLocaleString()} approved places`}
										icon="users"
									/>
								)}
							</div>

							{/* Care-type links stay anchored to the suburb (navigation, not the map area). */}
							{careLinks.length > 0 && (
								<div className="mt-5 flex flex-wrap gap-2">
									{careLinks.map((i) => (
										<Link
											key={i.href}
											href={i.href}
											className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ${
												i.active
													? "bg-teal-500 border-teal-500 text-white"
													: "bg-card border-border text-body hover:border-teal-300"
											}`}
										>
											{i.label}
											<span
												className={
													i.active
														? "opacity-80"
														: "text-muted-foreground"
												}
											>
												{i.n}
											</span>
										</Link>
									))}
								</div>
							)}

							<h2 className="sr-only">
								Childcare services in {data.suburbName}
							</h2>
							{centres.length > 0 ? (
								<div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
									{centres.map((c) => (
										<CentreListCard
											key={c.id}
											centre={c}
										/>
									))}
								</div>
							) : (
								<p className="mt-6 text-[15px] text-muted-foreground">
									{areaMode
										? "No centres in this map area. Zoom out or pan, then search again."
										: "No centres match these filters here. Clear a filter to see more."}
								</p>
							)}

							{nearby.length > 0 && (
								<section className="mt-12 border-t border-border pt-6">
									<h2 className="text-[18px] font-semibold text-foreground mb-3">
										Childcare in nearby suburbs
									</h2>
									<div className="flex flex-wrap gap-2">
										{nearby.map((s) => (
											<Link
												key={`${s.slug}-${s.postcode}`}
												href={`/childcare/${s.slug}/${s.postcode}`}
												className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-body hover:border-teal-300 hover:text-teal-700"
											>
												{s.suburb}
												<span className="text-muted-foreground">
													{s.count}
												</span>
											</Link>
										))}
									</div>
								</section>
							)}
						</div>

						{/* Right: the big map — sticky, full-height, flush to the viewport edge. */}
						<div className="hidden lg:block">
							<div className="sticky top-[60px] h-[calc(100dvh-60px)]">
								<div className="relative h-full">
									<MapPreview
										points={points}
										center={center}
										height="100%"
										rounded="0"
										interactive
										zoomInTick={zoomInTick}
										onRegionChange={(prompt) => {
											// Search emitted right after a "Zoom in to search" tap: run it now.
											if (
												prompt?.kind === "search" &&
												awaitingZoomInSearch.current
											) {
												awaitingZoomInSearch.current = false;
												searchArea(prompt);
												return;
											}
											setAreaPrompt(prompt);
										}}
									/>
									{areaPrompt?.kind === "search" && (
										<button
											type="button"
											onClick={() =>
												searchArea(areaPrompt)
											}
											className="absolute top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 rounded-full bg-card border border-border shadow-lg px-4 py-2 text-[13.5px] font-semibold text-teal-700 hover:bg-teal-50"
										>
											<Icon
												name="search"
												size={15}
											/>
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
											<Icon
												name="search"
												size={15}
											/>
											Zoom in to search
										</button>
									)}
									{loading && (
										<span className="absolute top-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground">
											Searching…
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}

function Stat({
	label,
	icon,
	tone,
}: {
	label: string;
	icon: string;
	tone?: "teal";
}) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium ${
				tone === "teal"
					? "border-teal-200 bg-teal-50 text-teal-700"
					: "border-border bg-card text-body"
			}`}
		>
			<Icon
				name={icon}
				size={14}
			/>
			{label}
		</span>
	);
}
