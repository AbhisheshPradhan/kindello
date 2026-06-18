"use client";

import { useState } from "react";
import Link from "next/link";
import type { DirectoryCentre, CategoryCount } from "@/lib/directory";
import { CentreCard } from "@/components/ds/centre-card";
import { CategoryTile } from "@/components/ds/category-tile";
import { GuideCard } from "@/components/ds/guide-card";
import { Icon } from "@/components/ds/icon";

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
		<div
			style={{
				display: "flex",
				alignItems: "flex-end",
				justifyContent: "space-between",
				gap: 16,
				marginBottom: 22,
			}}
		>
			<div>
				<h2
					className="ds-section-h2"
					style={{
						fontWeight: 600,
						letterSpacing: "-0.02em",
						color: "var(--fg)",
					}}
				>
					{title}
				</h2>
				{sub && (
					<p
						style={{
							fontSize: 15,
							color: "var(--muted-fg)",
							marginTop: 5,
						}}
					>
						{sub}
					</p>
				)}
			</div>
			{href && (
				<Link
					href={href}
					style={{
						fontSize: 14.5,
						fontWeight: 600,
						color: "var(--teal-600)",
						textDecoration: "none",
						whiteSpace: "nowrap",
					}}
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
		<div style={{ borderBottom: "1px solid var(--border)" }}>
			<button
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 16,
					width: "100%",
					padding: "20px 4px",
					background: "none",
					border: "none",
					cursor: "pointer",
					textAlign: "left",
					fontFamily: "var(--font-sans)",
					fontSize: 17,
					fontWeight: 600,
					color: "var(--fg)",
				}}
			>
				{q}
				<span
					style={{
						color: "var(--muted-fg)",
						flex: "none",
						transform: open ? "rotate(180deg)" : "none",
						transition: "transform .18s ease",
					}}
				>
					<Icon
						name="chevron-down"
						size={20}
					/>
				</span>
			</button>
			{open && (
				<p
					style={{
						padding: "0 4px 20px",
						fontSize: 15,
						lineHeight: 1.6,
						color: "var(--text-body)",
						maxWidth: 720,
					}}
				>
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
			<section
				className="ds-container"
				style={{ padding: "64px 24px" }}
			>
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
				style={{ background: "var(--teal-tint)", padding: "64px 0" }}
				id="browse"
			>
				<div
					className="ds-container"
					style={{ padding: "0 24px" }}
				>
					<h2
						className="ds-section-h2"
						style={{
							fontWeight: 600,
							letterSpacing: "-0.02em",
							color: "var(--fg)",
							marginBottom: 22,
						}}
					>
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
			<section
				className="ds-container"
				style={{ padding: "64px 24px" }}
			>
				<SectionHeader
					title="Explore by area"
					sub="Jump straight to a city or region."
				/>
				<div className="ds-grid ds-grid-3">
					{AREAS.map((a) => (
						<Link
							key={a.label}
							href={`/search?suburb=${encodeURIComponent(a.suburb)}`}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 14,
								padding: "18px 20px",
								background: "var(--surface)",
								border: "1px solid var(--border)",
								borderRadius: "var(--radius-xl)",
								textDecoration: "none",
								boxShadow: "var(--shadow-xs)",
							}}
						>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: 44,
									height: 44,
									borderRadius: "var(--radius-lg)",
									background:
										a.tone === "teal"
											? "var(--teal-50)"
											: a.tone === "coral"
												? "var(--coral-100)"
												: "var(--sun-100)",
									color:
										a.tone === "teal"
											? "var(--teal-600)"
											: a.tone === "coral"
												? "var(--coral-500)"
												: "var(--sun-500)",
								}}
							>
								<Icon
									name="map-pin"
									size={22}
								/>
							</span>
							<span>
								<span
									style={{
										display: "block",
										fontSize: 16,
										fontWeight: 600,
										color: "var(--fg)",
									}}
								>
									{a.label}
								</span>
								<span
									style={{
										fontSize: 13,
										color: "var(--muted-fg)",
									}}
								>
									Browse centres →
								</span>
							</span>
						</Link>
					))}
				</div>
			</section>

			{/* Guides */}
			<section
				style={{ background: "var(--sun-tint)", padding: "64px 0" }}
				id="guides"
			>
				<div
					className="ds-container"
					style={{ padding: "0 24px" }}
				>
					<h2
						className="ds-section-h2"
						style={{
							fontWeight: 600,
							letterSpacing: "-0.02em",
							color: "var(--fg)",
							marginBottom: 22,
						}}
					>
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
				className="ds-container"
				style={{ padding: "64px 24px", maxWidth: 860 }}
				id="about"
			>
				<h2
					className="ds-section-h2"
					style={{
						fontWeight: 600,
						letterSpacing: "-0.02em",
						color: "var(--fg)",
						marginBottom: 8,
					}}
				>
					Frequently asked questions
				</h2>
				<div style={{ marginTop: 16 }}>
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
