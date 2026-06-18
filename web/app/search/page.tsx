import type { Metadata } from "next";
import { Suspense } from "react";
import { searchDirectory } from "@/lib/directory";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { CentreCard } from "@/components/ds/centre-card";
import { SearchFilters } from "@/components/search/search-filters";

const TYPE_LABEL: Record<string, string> = {
	long_day_care: "Long day care",
	family_day_care: "Family day care",
	preschool: "Preschool & kindy",
	oshc: "Outside school hours care",
};

type SP = { suburb?: string; type?: string; minRating?: string };

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<SP>;
}): Promise<Metadata> {
	const sp = await searchParams;
	const where = sp.suburb ? ` near ${sp.suburb}` : " in Australia";
	const type = sp.type
		? `${TYPE_LABEL[sp.type] ?? "Childcare"}`
		: "Approved childcare centres";
	const title = `${type}${where} | Kindello`;
	return {
		title,
		description: `Browse ${type.toLowerCase()}${where} with NQS quality ratings, approved places and care types, synced daily from ACECQA.`,
		alternates: { canonical: "/search" },
	};
}

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<SP>;
}) {
	const sp = await searchParams;
	const { centres, locationLabel, total } = await searchDirectory({
		suburb: sp.suburb,
		type: sp.type,
		minRating: sp.minRating,
		limit: 24,
	});

	const [featured, ...rest] = centres;
	const heading = locationLabel
		? `${TYPE_LABEL[sp.type ?? ""] ?? "Childcare centres"} near ${locationLabel}`
		: sp.type
			? (TYPE_LABEL[sp.type] ?? "Approved childcare centres")
			: "Approved childcare centres";

	return (
		<div
			style={{
				minHeight: "100dvh",
				display: "flex",
				flexDirection: "column",
				background: "var(--bg)",
			}}
		>
			<SiteHeader />
			<main style={{ flex: 1 }}>
				{/* Title band */}
				<section
					style={{
						background: "var(--teal-tint)",
						borderBottom: "1px solid var(--border)",
					}}
				>
					<div
						className="ds-container"
						style={{ padding: "40px 24px 32px" }}
					>
						<h1
							className="ds-page-h1"
							style={{
								fontWeight: 600,
								letterSpacing: "-0.02em",
								color: "var(--fg)",
							}}
						>
							{heading}
						</h1>
						<p
							style={{
								fontSize: 15,
								color: "var(--text-body)",
								marginTop: 8,
							}}
						>
							{total.toLocaleString()}{" "}
							{total === 1 ? "centre" : "centres"} match
							{locationLabel
								? `, nearest to ${locationLabel} first`
								: " across Australia"}
							. Quality ratings from ACECQA.
						</p>
						<div style={{ marginTop: 20 }}>
							<Suspense fallback={null}>
								<SearchFilters />
							</Suspense>
						</div>
					</div>
				</section>

				<div
					className="ds-container"
					style={{ padding: "36px 24px 64px" }}
				>
					{centres.length === 0 ? (
						<div
							style={{
								padding: "48px 0",
								textAlign: "center",
								color: "var(--muted-fg)",
							}}
						>
							No centres match those filters yet. Try a nearby
							suburb or lower the minimum rating.
						</div>
					) : (
						<>
							{featured && (
								<div style={{ marginBottom: 28 }}>
									<CentreCard
										featured
										href={`/centre/${featured.id}`}
										name={featured.name}
										suburb={featured.suburb ?? ""}
										distance=""
										rating={featured.stars}
										reviews={featured.reviews}
										nqs={featured.rating}
										tags={featured.tags}
										keyInfo={
											featured.places != null
												? `${featured.places} approved places`
												: ""
										}
										seed={featured.seed}
									/>
								</div>
							)}
							<div className="ds-grid ds-grid-3">
								{rest.map((c) => (
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
						</>
					)}
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
