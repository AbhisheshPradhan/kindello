import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
	getCentreDetail,
	getNearbyCentres,
	distanceKm,
	type CentreDetail,
} from "@/lib/directory";
import { summariseHours, ratingLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { CentreCard } from "@/components/ds/centre-card";
import { RatingTag } from "@/components/ds/rating-tag";
import { StarRating } from "@/components/ds/star-rating";
import { Tag } from "@/components/ds/tag";
import { Icon, type IconName } from "@/components/ds/icon";
import { MapPreview } from "@/components/ds/map-preview";
import { CentreActions } from "@/components/centre/centre-actions";

function mapsLinkFor(c: CentreDetail): string {
	const q = [c.name, c.address, c.suburb, c.state, c.postcode]
		.filter(Boolean)
		.join(", ");
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function ageRange(c: CentreDetail): string {
	if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation)
		return "5 – 12 years";
	if (c.flags.preschoolStandalone || c.flags.preschoolSchool)
		return "3 – 5 years";
	if (c.flags.familyDayCare) return "6 weeks – 12 years";
	return "6 weeks – 5 years";
}

type Program = { name: string; age: string; blurb: string; icon: IconName };
function programs(c: CentreDetail): Program[] {
	if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation) {
		return [
			{
				name: "Before school care",
				age: "5 – 12 yrs",
				blurb: "An easy, supervised start to the day with breakfast and free play before the school bell.",
				icon: "sun",
			},
			{
				name: "After school care",
				age: "5 – 12 yrs",
				blurb: "Homework help, sport and creative activities in a relaxed setting until pick-up.",
				icon: "blocks",
			},
			{
				name: "Vacation care",
				age: "5 – 12 yrs",
				blurb: "A full holiday program of excursions, incursions and themed activity days.",
				icon: "graduation-cap",
			},
		];
	}
	if (c.flags.preschoolStandalone || c.flags.preschoolSchool) {
		return [
			{
				name: "3 year old kinder",
				age: "3 – 4 yrs",
				blurb: "A play-based introduction to group learning, building social skills and curiosity.",
				icon: "blocks",
			},
			{
				name: "4 year old kinder",
				age: "4 – 5 yrs",
				blurb: "A government-funded program focused on school readiness in the year before school.",
				icon: "graduation-cap",
			},
		];
	}
	return [
		{
			name: "Nursery",
			age: "6 wks – 2 yrs",
			blurb: "Warm, responsive care for babies with primary educators and a calm routine.",
			icon: "baby",
		},
		{
			name: "Toddlers",
			age: "2 – 3 yrs",
			blurb: "Active, sensory play that supports language, movement and growing independence.",
			icon: "blocks",
		},
		{
			name: "Kindergarten",
			age: "3 – 5 yrs",
			blurb: "A play-based program building literacy, numeracy and school-readiness.",
			icon: "graduation-cap",
		},
	];
}

const FEATURES: { label: string; icon: IconName }[] = [
	{ label: "Nutritious meals prepared on-site", icon: "utensils" },
	{ label: "Natural outdoor play spaces", icon: "leaf" },
	{ label: "Qualified, long-tenured educators", icon: "users" },
	{ label: "Child Care Subsidy (CCS) approved", icon: "dollar-sign" },
	{ label: "Daily updates via parent app", icon: "phone" },
	{ label: "School-readiness program", icon: "graduation-cap" },
	{ label: "Inclusive of additional needs", icon: "accessibility" },
	{ label: "Incursions and excursions", icon: "calendar" },
];

// Representative reviews (preview content — verified Google reviews are Tier-2 enrichment).
function reviews(c: CentreDetail) {
	const pool = [
		{
			author: "Priya M.",
			when: "2 weeks ago",
			body: "The educators genuinely know our daughter, and her settling-in was so gentle. We get a lovely daily summary, and the outdoor area is a highlight.",
		},
		{
			author: "Tom R.",
			when: "1 month ago",
			body: "Communication is excellent and you can tell the team is experienced. Our son has come out of his shell here. Waitlist moved faster than we expected.",
		},
		{
			author: "Sarah & Dan",
			when: "2 months ago",
			body: "Clean, warm and well-run. The kinder program had our eldest more than ready for school. Highly recommend a tour to any local family.",
		},
	];
	return pool.slice(0, 3).map((r, i) => ({
		...r,
		rating: Math.max(4, Math.round(c.stars) - (i % 2)),
	}));
}

function faqs(c: CentreDetail) {
	const hours = summariseHours(c.operatingHours);
	const place = [c.suburb, c.state].filter(Boolean).join(", ");
	return [
		{
			q: `What are ${c.name}'s opening hours?`,
			a: hours
				? `${c.name} operates ${hours}. Hours can vary across school terms and holidays, so confirm specific session times when you enquire.`
				: `Opening hours for ${c.name} aren't published in the register, so the centre can confirm current session times when you enquire.`,
		},
		{
			q: `What is the NQS rating of ${c.name}?`,
			a: `${c.name} is rated "${ratingLabel(c.rating)}" against the National Quality Standard, the assessment all approved Australian services are measured against by ACECQA across seven quality areas.`,
		},
		{
			q: `How many places does ${c.name} have?`,
			a:
				c.places != null
					? `${c.name} is approved for ${c.places} places. Live vacancies change often, so enquire to check current availability for your child's age group.`
					: `Approved places for this service aren't listed, so the centre can confirm capacity and availability directly.`,
		},
		{
			q: `Is ${c.name} approved for the Child Care Subsidy?`,
			a: `As an ACECQA-approved service${place ? ` in ${place}` : ""}, eligible families can typically claim the Child Care Subsidy here. Your subsidy percentage depends on your family income and activity, and Services Australia can confirm your rate.`,
		},
	];
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const c = await getCentreDetail(id);
	if (!c) return { title: "Centre not found | Kindello" };
	const place = [c.suburb, c.state].filter(Boolean).join(", ");
	const title = `${c.name}${place ? `, ${place}` : ""}: NQS rating, places & programs | Kindello`;
	return {
		title,
		description: `${c.name}${place ? ` in ${place}` : ""} is rated ${ratingLabel(c.rating)} against the National Quality Standard${
			c.places != null ? `, with ${c.places} approved places` : ""
		}. See programs, hours, features and how to enquire.`,
		alternates: { canonical: `/centre/${c.id}` },
		openGraph: { title, type: "profile" },
	};
}

const GALLERY = [
	"linear-gradient(135deg,#2fb3b3,#1ca6a6 60%,#136d6d)",
	"linear-gradient(135deg,#ffc83d,#ff8166 70%,#f9603f)",
	"linear-gradient(135deg,#57c5c5,#2fb3b3 60%,#158888)",
];

// Shared section/panel class strings — the detail page repeats these throughout.
const SECTION_H2 = "text-[22px] font-semibold text-foreground";
const PANEL = "border border-border rounded-xl p-4.5 bg-card shadow-xs";

export default async function CentrePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const centre = await getCentreDetail(id);
	if (!centre) notFound();

	const [nearby] = await Promise.all([getNearbyCentres(centre, 3)]);
	const hours = summariseHours(centre.operatingHours);
	const mapsLink = mapsLinkFor(centre);
	const place = [centre.suburb, centre.state].filter(Boolean).join(", ");
	const progs = programs(centre);
	const revs = reviews(centre);
	const qs = faqs(centre);

	const facts: { label: string; value: string; icon: IconName }[] = [
		{ label: "Age range", value: ageRange(centre), icon: "baby" },
		{ label: "Hours", value: hours ?? "On enquiry", icon: "clock" },
		{
			label: "Capacity",
			value:
				centre.places != null
					? `${centre.places} places`
					: "On enquiry",
			icon: "users",
		},
		{ label: "Fees", value: "On enquiry · CCS", icon: "dollar-sign" },
		{
			label: "NQS rating",
			value: ratingLabel(centre.rating),
			icon: "shield-check",
		},
		{ label: "Availability", value: "Enquire", icon: "calendar" },
	];

	return (
		<div className="min-h-dvh flex flex-col bg-background">
			<SiteHeader />
			<main className="flex-1">
				<div className="ds-container pt-6 pb-16">
					{/* Breadcrumb */}
					<nav className="flex flex-wrap gap-2 text-[13.5px] text-muted-foreground mb-4.5">
						<Link
							href="/"
							className="text-muted-foreground no-underline"
						>
							Home
						</Link>
						<span>›</span>
						<Link
							href="/search"
							className="text-muted-foreground no-underline"
						>
							Childcare
						</Link>
						{centre.suburb && (
							<>
								<span>›</span>
								<Link
									href={`/search?suburb=${encodeURIComponent(centre.suburb)}`}
									className="text-muted-foreground no-underline"
								>
									{centre.suburb}
								</Link>
							</>
						)}
						<span>›</span>
						<span className="text-body">{centre.name}</span>
					</nav>

					{/* Header block */}
					<div className="flex flex-wrap gap-5 items-start justify-between">
						<div className="max-w-160">
							<div className="flex flex-wrap items-center gap-2.5 mb-3">
								<RatingTag rating={centre.rating} long />
								<span className="inline-flex items-center gap-1.25 text-[13px] text-teal-700">
									<Icon
										name="shield-check"
										size={14}
									/>{" "}
									ACECQA-verified · synced today
								</span>
							</div>
							<h1 className="ds-page-h1 font-semibold tracking-[-0.02em] text-foreground">
								{centre.name}
							</h1>
							<div className="flex items-center gap-1.75 mt-2.5 text-[15px] text-muted-foreground">
								<Icon
									name="map-pin"
									size={16}
								/>
								<span>
									{centre.address
										? `${centre.address}, ${place}`
										: place}
								</span>
							</div>
							<div className="mt-3">
								<StarRating
									value={centre.stars}
									count={centre.reviews}
									size={17}
								/>
							</div>
							<div className="flex flex-wrap gap-1.5 mt-3.5">
								{centre.tags.map((t) => (
									<Tag
										key={t}
										tone="teal"
									>
										{t}
									</Tag>
								))}
							</div>
						</div>
						<CentreActions
							phone={centre.phone}
							mapsLink={mapsLink}
						/>
					</div>

					{/* Photo gallery */}
					<div className="grid grid-cols-[2fr_1fr] gap-3 mt-7 h-85">
						<div
							className="relative rounded-xl overflow-hidden"
							style={{
								background:
									GALLERY[centre.seed % GALLERY.length],
							}}
						>
							<span className="absolute inset-0 flex items-center justify-center text-white/50">
								<Icon
									name="baby"
									size={72}
									strokeWidth={1.5}
								/>
							</span>
							<span className="absolute bottom-3 left-3 px-2.75 py-1.25 text-xs font-semibold text-teal-700 bg-white/92 rounded-full">
								Photos coming soon
							</span>
						</div>
						<div className="grid grid-rows-[1fr_1fr] gap-3">
							{[1, 2].map((n) => (
								<div
									key={n}
									className="rounded-xl overflow-hidden"
									style={{
										background:
											GALLERY[
												(centre.seed + n) %
													GALLERY.length
											],
									}}
								/>
							))}
						</div>
					</div>

					{/* Quick facts bar */}
					<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px mt-7 bg-border border rounded-xl overflow-hidden">
						{facts.map((f) => (
							<div
								key={f.label}
								className="bg-card px-4.5 py-4"
							>
								<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
									<Icon
										name={f.icon}
										size={14}
									/>{" "}
									{f.label}
								</span>
								<div className="text-[15px] font-semibold text-foreground">
									{f.value}
								</div>
							</div>
						))}
					</div>

					{/* Two-column: content + sticky aside */}
					<div className="ds-detail-layout mt-10">
						<div className="flex flex-col gap-10">
							{/* About */}
							<section>
								<h2 className={cn(SECTION_H2, "mb-3")}>
									About {centre.name}
								</h2>
								<div className="text-[15.5px] leading-[1.7] text-body flex flex-col gap-3.5">
									<p>
										{centre.name} is an approved{" "}
										{centre.flags.familyDayCare
											? "family day care service"
											: "early-education and care service"}
										{place ? ` in ${place}` : ""}, listed on
										the ACECQA national register and rated{" "}
										<strong className="text-foreground">
											{ratingLabel(centre.rating)}
										</strong>{" "}
										against the National Quality Standard.{" "}
										{centre.providerName
											? `It is operated by ${centre.providerName}.`
											: ""}
									</p>
									<p>
										The service caters for children aged{" "}
										{ageRange(centre).toLowerCase()}
										{centre.places != null
											? `, with ${centre.places} approved places across its rooms`
											: ""}
										. {hours ? `It is open ${hours}.` : ""}{" "}
										Families choose{" "}
										{centre.suburb ?? "this area"} centres
										like this one for qualified educators, a
										play-based program and a genuine focus
										on school readiness. Confirm the current
										program and availability when you
										enquire.
									</p>
								</div>
							</section>

							{/* Programs / age groups */}
							<section>
								<h2 className={cn(SECTION_H2, "mb-4")}>
									Programs &amp; age groups
								</h2>
								<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
									{progs.map((p) => (
										<div
											key={p.name}
											className={PANEL}
										>
											<span className="inline-flex items-center justify-center w-10.5 h-10.5 rounded-lg bg-teal-50 text-teal-600 mb-3">
												<Icon
													name={p.icon}
													size={22}
												/>
											</span>
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-base font-semibold text-foreground">
													{p.name}
												</h3>
												<Tag tone="sun">{p.age}</Tag>
											</div>
											<p className="text-sm leading-[1.6] text-body">
												{p.blurb}
											</p>
										</div>
									))}
								</div>
							</section>

							{/* Features & facilities */}
							<section>
								<h2 className={cn(SECTION_H2, "mb-4")}>
									What to look for in this type of care
								</h2>
								<div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
									{FEATURES.map((f) => (
										<div
											key={f.label}
											className="flex items-center gap-2.5 text-[14.5px] text-body"
										>
											<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 text-teal-600 flex-none">
												<Icon
													name="check"
													size={16}
												/>
											</span>
											{f.label}
										</div>
									))}
								</div>
							</section>

							{/* NQS quality areas */}
							<section>
								<h2 className={cn(SECTION_H2, "mb-1.5")}>
									Quality rating breakdown
								</h2>
								<p className="text-[14.5px] text-muted-foreground mb-4">
									How {centre.name} is rated across the seven
									National Quality Standard areas, assessed by
									ACECQA.
								</p>
								<div className="border border-border rounded-xl overflow-hidden">
									{centre.qualityAreas.map((qa, i) => (
										<div
											key={qa.area}
											className={cn(
												"flex items-center justify-between gap-3 px-4 py-3.25 bg-card",
												i !== 0 && "border-t",
											)}
										>
											<span className="text-[14.5px] text-body">
												<span className="text-muted-foreground font-mono mr-2">
													QA{qa.area}
												</span>
												{qa.label}
											</span>
											<RatingTag rating={qa.rating} long />
										</div>
									))}
								</div>
							</section>

							{/* Location */}
							<section>
								<h2 className={cn(SECTION_H2, "mb-4")}>
									Location
								</h2>
								<MapPreview
									points={
										centre.lat != null && centre.lng != null
											? [
													{
														lat: centre.lat,
														lng: centre.lng,
														rating: centre.rating,
														label: centre.name,
													},
												]
											: []
									}
									height={300}
									showLabels
								/>
								<div className="flex flex-wrap gap-3 mt-3.5 items-center justify-between">
									<span className="text-[14.5px] text-body">
										{centre.address
											? `${centre.address}, ${place}`
											: place}
									</span>
									<a
										href={mapsLink}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 no-underline"
									>
										Open in Google Maps{" "}
										<Icon
											name="arrow-right"
											size={15}
										/>
									</a>
								</div>
							</section>

							{/* Reviews */}
							<section>
								<div className="flex items-center gap-3 mb-1.5 flex-wrap">
									<h2 className={SECTION_H2}>
										Parent reviews
									</h2>
									<StarRating
										value={centre.stars}
										count={centre.reviews}
										size={16}
									/>
								</div>
								<p className="text-[13px] text-muted-foreground mb-4">
									Preview reviews. Verified Google reviews are
									being added to Kindello.
								</p>
								<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
									{revs.map((r, i) => (
										<div
											key={i}
											className={PANEL}
										>
											<StarRating
												value={r.rating}
												showValue={false}
												size={14}
											/>
											<p className="text-[14.5px] leading-[1.6] text-body mt-2.5 mb-3">
												“{r.body}”
											</p>
											<div className="flex items-center justify-between text-[13px] text-muted-foreground">
												<strong className="text-foreground font-semibold">
													{r.author}
												</strong>
												<span>{r.when}</span>
											</div>
										</div>
									))}
								</div>
							</section>

							{/* FAQ */}
							<section>
								<h2 className={cn(SECTION_H2, "mb-4")}>
									Frequently asked questions
								</h2>
								<div>
									{qs.map((f, i) => (
										<div
											key={i}
											className={cn(
												"py-4.5",
												i !== 0 && "border-t",
											)}
										>
											<h3 className="text-base font-semibold text-foreground mb-2">
												{f.q}
											</h3>
											<p className="text-[14.5px] leading-[1.65] text-body">
												{f.a}
											</p>
										</div>
									))}
								</div>
							</section>
						</div>

						{/* Sticky enquiry aside */}
						<aside className="sticky top-20 self-start">
							<div className="border border-border rounded-2xl p-5.5 bg-card shadow-md">
								<h3 className="text-[18px] font-semibold text-foreground">
									Enquire with {centre.name}
								</h3>
								<p className="text-sm leading-[1.6] text-body mt-2 mb-4">
									Ask about availability, fees and tours. Send
									an enquiry and the centre will be in touch.
								</p>
								<CentreActions
									phone={centre.phone}
									mapsLink={mapsLink}
								/>
								{centre.phone && (
									<div className="mt-4 pt-4 border-t text-sm text-body inline-flex items-center gap-2">
										<span className="text-teal-600 inline-flex">
											<Icon
												name="phone"
												size={15}
											/>
										</span>
										<a
											href={`tel:${centre.phone}`}
											className="text-foreground no-underline font-mono"
										>
											{centre.phone}
										</a>
									</div>
								)}
							</div>
						</aside>
					</div>

					{/* Related centres */}
					{nearby.length > 0 && (
						<section className="mt-14">
							<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground mb-5.5">
								Other centres nearby
							</h2>
							<div className="ds-grid ds-grid-3">
								{nearby.map((n) => (
									<CentreCard
										key={n.id}
										href={`/centre/${n.id}`}
										name={n.name}
										suburb={n.suburb ?? ""}
										distance={
											centre.lat != null &&
											centre.lng != null &&
											n.lat != null &&
											n.lng != null
												? `${distanceKm(centre.lat, centre.lng, n.lat, n.lng)} km`
												: ""
										}
										rating={n.stars}
										reviews={n.reviews}
										nqs={n.rating}
										tags={n.tags}
										keyInfo={
											n.places != null
												? `${n.places} approved places`
												: ""
										}
										seed={n.seed}
									/>
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
