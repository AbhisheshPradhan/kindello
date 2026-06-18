"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DirectoryCentre, CategoryCount } from "@/lib/directory";
import { CentreCard } from "@/components/ds/centre-card";
import { CategoryTile } from "@/components/ds/category-tile";
import { GuideCard } from "@/components/ds/guide-card";
import { Icon } from "@/components/ds/icon";

const AREA_TONES: Record<"teal" | "coral" | "sun", string> = {
	teal: "bg-teal-50 text-teal-600",
	coral: "bg-coral-100 text-coral-500",
	sun: "bg-sun-100 text-sun-500",
};

const AREAS: {
	suburb: string;
	label: string;
	tone: "teal" | "coral" | "sun";
}[] = [
	{ suburb: "Surry Hills", label: "Sydney", tone: "teal" },
	{ suburb: "Carlton", label: "Melbourne", tone: "coral" },
	{ suburb: "South Brisbane", label: "Brisbane", tone: "sun" },
	{ suburb: "Fremantle", label: "Perth", tone: "teal" },
	{ suburb: "Norwood", label: "Adelaide", tone: "coral" },
	{ suburb: "Newcastle", label: "Newcastle", tone: "sun" },
];

const GUIDES = [
	{
		category: "Choosing care",
		title: "How to read an NQS quality rating",
		readTime: "5 min read",
		seed: 0,
	},
	{
		category: "Costs",
		title: "Understanding the Child Care Subsidy",
		readTime: "6 min read",
		seed: 1,
	},
	{
		category: "Getting started",
		title: "Daycare waitlists: when to apply",
		readTime: "4 min read",
		seed: 2,
	},
];

const FAQS = [
	{
		q: "Where does Kindello's data come from?",
		a: "Every centre is drawn from the ACECQA national registers, the official record of approved childcare and early-education services in Australia, and synced daily. Quality ratings, approved places and service types come straight from the regulator.",
	},
	{
		q: "What do the NQS ratings mean?",
		a: "The National Quality Standard rates each service across seven quality areas. From best to lowest: Excellent, Exceeding NQS, Meeting NQS, Working Towards NQS, and Significant Improvement Required. A centre can also be Not yet rated if it's new.",
	},
	{
		q: "Is Kindello free for parents?",
		a: "Yes. Searching, comparing and enquiring is free for families. We work with centres and directories on the supply side.",
	},
	{
		q: "How do I know if a centre has a place?",
		a: "We show each centre's approved places from the register. Live vacancies change often, so the fastest way to confirm a spot is to enquire with the centre directly through Kindello.",
	},
];

function SectionHeader({
	title,
	sub,
	href,
}: {
	title: string;
	sub?: string;
	href?: string;
}) {
	return (
		<div className="flex items-end justify-between gap-4 mb-5.5">
			<div>
				<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground">
					{title}
				</h2>
				{sub && (
					<p className="text-[15px] text-muted-foreground mt-1.25">
						{sub}
					</p>
				)}
			</div>
			{href && (
				<Link
					href={href}
					className="text-[14.5px] font-semibold text-teal-600 no-underline whitespace-nowrap"
				>
					See all →
				</Link>
			)}
		</div>
	);
}

function FaqItem({ q, a }: { q: string; a: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="border-b">
			<button
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				className="flex items-center justify-between gap-4 w-full px-1 py-5 bg-none border-none text-left font-sans text-[17px] font-semibold text-foreground"
			>
				{q}
				<span
					className={cn(
						"text-muted-foreground flex-none transition-transform duration-180",
						open && "rotate-180",
					)}
				>
					<Icon
						name="chevron-down"
						size={20}
					/>
				</span>
			</button>
			{open && (
				<p className="px-1 pb-5 text-[15px] leading-[1.6] text-body max-w-180">
					{a}
				</p>
			)}
		</div>
	);
}

export function MarketingSections({
	popular,
	categories,
}: {
	popular: DirectoryCentre[];
	categories: CategoryCount[];
}) {
	return (
		<>
			{/* Popular near you */}
			<section className="ds-container py-16">
				<SectionHeader
					title="Popular near you"
					sub="Highly rated approved centres in your area."
					href="/search"
				/>
				<div className="ds-grid ds-grid-4">
					{popular.map((c) => (
						<CentreCard
							key={c.id}
							href={`/centre/${c.id}`}
							name={c.name}
							suburb={c.suburb ?? ""}
							distance=""
							rating={c.stars}
							reviews={c.reviews}
							nqs={c.rating}
							tags={c.tags}
							keyInfo={
								c.places != null
									? `${c.places} approved places`
									: ""
							}
							seed={c.seed}
						/>
					))}
				</div>
			</section>

			{/* Browse by type */}
			<section
				className="bg-teal-tint py-16"
				id="browse"
			>
				<div className="ds-container">
					<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground mb-5.5">
						Browse by type
					</h2>
					<div className="ds-grid ds-grid-5">
						{categories.map((cat) => (
							<CategoryTile
								key={cat.label}
								href={
									cat.key
										? `/search?type=${cat.key}`
										: "/search"
								}
								icon={cat.icon}
								label={cat.label}
								count={cat.count}
								tone={cat.tone}
							/>
						))}
					</div>
				</div>
			</section>

			{/* Explore by area */}
			<section className="ds-container py-16">
				<SectionHeader
					title="Explore by area"
					sub="Jump straight to a city or region."
				/>
				<div className="ds-grid ds-grid-3">
					{AREAS.map((a) => (
						<Link
							key={a.label}
							href={`/search?suburb=${encodeURIComponent(a.suburb)}`}
							className="flex items-center gap-3.5 px-5 py-4.5 bg-card border border-border rounded-xl no-underline shadow-xs"
						>
							<span
								className={cn(
									"inline-flex items-center justify-center w-11 h-11 rounded-lg",
									AREA_TONES[a.tone],
								)}
							>
								<Icon
									name="map-pin"
									size={22}
								/>
							</span>
							<span>
								<span className="block text-base font-semibold text-foreground">
									{a.label}
								</span>
								<span className="text-[13px] text-muted-foreground">
									Browse centres →
								</span>
							</span>
						</Link>
					))}
				</div>
			</section>

			{/* Guides */}
			<section
				className="bg-sun-tint py-16"
				id="guides"
			>
				<div className="ds-container">
					<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground mb-5.5">
						Guides for parents
					</h2>
					<div className="ds-grid ds-grid-3">
						{GUIDES.map((g) => (
							<GuideCard
								key={g.title}
								href="/#guides"
								category={g.category}
								title={g.title}
								readTime={g.readTime}
								seed={g.seed}
							/>
						))}
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section
				className="max-w-215 mx-auto px-4 sm:px-6 w-full py-16"
				id="about"
			>
				<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground mb-2">
					Frequently asked questions
				</h2>
				<div className="mt-4">
					{FAQS.map((f) => (
						<FaqItem
							key={f.q}
							q={f.q}
							a={f.a}
						/>
					))}
				</div>
			</section>
		</>
	);
}
