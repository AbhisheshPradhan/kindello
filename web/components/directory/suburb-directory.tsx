import Link from "next/link";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { MapPreview, type MapPoint } from "@/components/ds/map-preview";
import { PlaceResultCard } from "@/components/ds/place-result-card";
import { Icon } from "@/components/ds/icon";
import { summariseHours } from "@/lib/format";
import {
	CARE_TYPES,
	centrePath,
	stateName,
	type CareTypeSlug,
	type SuburbLink,
	type SuburbPage,
} from "@/lib/directory";

// Care-type → first tag-style label for the pin card.
function careLabel(c: SuburbPage["centres"][number]): string | null {
	if (c.flags.ldc) return "Long day care";
	if (c.flags.preschoolStandalone || c.flags.preschoolSchool) return "Preschool";
	if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation)
		return "OSHC";
	if (c.flags.familyDayCare) return "Family day care";
	return "Early learning";
}

function CareLinks({
	data,
}: {
	data: SuburbPage;
}) {
	const base = `${data.suburbName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${data.postcode}`;
	const items: { href: string; label: string; n: number; active: boolean }[] = [
		{
			href: `/childcare/${base}`,
			label: "All childcare",
			n: data.stats.total,
			active: data.careType === null,
		},
		...(Object.keys(CARE_TYPES) as CareTypeSlug[]).map((slug) => ({
			href: `/${slug}/${base}`,
			label: CARE_TYPES[slug].label,
			n: data.stats.byCare[slug],
			active: data.careType === slug,
		})),
	].filter((i) => i.n > 0);

	return (
		<div className="flex flex-wrap gap-2">
			{items.map((i) => (
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
					<span className={i.active ? "opacity-80" : "text-muted-foreground"}>
						{i.n}
					</span>
				</Link>
			))}
		</div>
	);
}

export function SuburbDirectory({
	data,
	nearby,
}: {
	data: SuburbPage;
	nearby: SuburbLink[];
}) {
	const { suburbName, state, postcode, careType, centres, stats } = data;
	const stateLong = state ? (stateName(state) ?? state) : "";
	const typeLabel = careType ? CARE_TYPES[careType].label : "Childcare";
	const heading = careType
		? `${CARE_TYPES[careType].label} in ${suburbName}, ${state} ${postcode}`
		: `Childcare in ${suburbName}, ${state} ${postcode}`;

	const points: MapPoint[] = centres
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

	const intro = `There ${stats.total === 1 ? "is" : "are"} ${stats.total} approved ${
		careType ? `${CARE_TYPES[careType].label.toLowerCase()} ` : ""
	}${stats.total === 1 ? "service" : "services"} in ${suburbName} (${postcode})${
		stateLong ? `, ${stateLong}` : ""
	}. ${
		stats.exceeding > 0
			? `${stats.exceeding} rated Exceeding NQS or above`
			: "None are rated Exceeding NQS or above yet"
	}${
		stats.totalPlaces > 0
			? `, with around ${stats.totalPlaces.toLocaleString()} approved places in total.`
			: "."
	}`;

	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<SiteHeader />
			<main className="flex-1">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
					{/* Breadcrumb */}
					<nav className="text-[12.5px] text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
						<Link href="/" className="hover:text-teal-700">
							Home
						</Link>
						<span>/</span>
						{state && (
							<>
								<Link
									href={`/childcare/${state.toLowerCase()}`}
									className="hover:text-teal-700"
								>
									{stateLong}
								</Link>
								<span>/</span>
							</>
						)}
						<span className="text-body">{suburbName}</span>
					</nav>

					<h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-foreground">
						{heading}
					</h1>
					<p className="mt-2 max-w-2xl text-[15px] text-muted-foreground leading-relaxed">
						{intro}
					</p>

					{/* Stat bar */}
					<div className="mt-5 flex flex-wrap gap-2.5">
						<Stat label={`${stats.total} ${stats.total === 1 ? "centre" : "centres"}`} icon="map-pin" />
						{stats.exceeding > 0 && (
							<Stat label={`${stats.exceeding} Exceeding+`} icon="sparkles" tone="teal" />
						)}
						{stats.totalPlaces > 0 && (
							<Stat label={`${stats.totalPlaces.toLocaleString()} approved places`} icon="users" />
						)}
					</div>

					{/* Care-type cross-links */}
					<div className="mt-5">
						<CareLinks data={data} />
					</div>

					{/* Results: list (primary) + sticky map */}
					<div className="mt-7 grid gap-6 lg:grid-cols-[1fr_minmax(300px,380px)]">
						<div className="order-2 lg:order-1">
							<h2 className="sr-only">{typeLabel} services in {suburbName}</h2>
							<div className="grid gap-4 grid-cols-1 min-[480px]:grid-cols-2">
								{centres.map((c) => (
									<PlaceResultCard
										key={c.id}
										name={c.name}
										suburb={c.suburb ?? ""}
										address={
											[c.address, c.suburb, c.state, c.postcode]
												.filter(Boolean)
												.join(", ") || null
										}
										verified={false}
										nqsRating={c.rating}
										rating={c.stars}
										reviews={c.reviews}
										placesNow={c.places != null ? `${c.places} approved places` : null}
										phone={c.phone}
										seed={c.seed}
										href={centrePath(c)}
									/>
								))}
							</div>
						</div>
						<div className="order-1 lg:order-2">
							<div className="lg:sticky lg:top-4">
								<MapPreview
									points={points}
									center={data.center}
									height={360}
									interactive
								/>
							</div>
						</div>
					</div>

					{/* Internal links */}
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
										<span className="text-muted-foreground">{s.count}</span>
									</Link>
								))}
							</div>
						</section>
					)}
				</div>
			</main>
			<SiteFooter />
		</div>
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
			<Icon name={icon} size={14} />
			{label}
		</span>
	);
}
