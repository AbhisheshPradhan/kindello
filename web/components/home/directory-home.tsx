import Link from "next/link";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { Icon } from "@/components/ds/icon";
import { MarketingSections } from "./marketing-sections";
import { DirectorySearchHero } from "./directory-search-hero";
import type { DirectoryCentre, CategoryCount } from "@/lib/directory";

const STATE_LINKS: [string, string][] = [
	["NSW", "nsw"],
	["VIC", "vic"],
	["QLD", "qld"],
	["WA", "wa"],
	["SA", "sa"],
	["TAS", "tas"],
	["ACT", "act"],
	["NT", "nt"],
];

// Traditional directory homepage: location search → suburb landing pages, then the
// browse/SEO sections. The AI chat homepage is preserved in HomeExperience (swap in
// app/page.tsx to flip back).
export function DirectoryHome({
	popular,
	categories,
	total,
}: {
	popular: DirectoryCentre[];
	categories: CategoryCount[];
	total: number;
}) {
	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<SiteHeader />
			<main className="flex-1">
				<section
					className="text-center pt-18 px-4 sm:px-6 pb-14"
					style={{
						background:
							"linear-gradient(180deg, var(--teal-tint), var(--bg) 86%)",
					}}
				>
					<div className="max-w-190 mx-auto">
						<span className="inline-flex items-center gap-1.75 px-3.5 py-1.5 text-[13.5px] font-semibold text-teal-700 bg-card border border-teal-200 rounded-full shadow-xs mb-5.5">
							<Icon name="shield-check" size={14} />
							{total.toLocaleString()} approved centres
						</span>
						<h1 className="ds-hero-h1 font-semibold tracking-[-0.03em] leading-[1.05] text-foreground">
							Find childcare near you.
						</h1>
						<p className="text-[19px] leading-normal text-body mt-4.5 mx-auto max-w-145">
							Every approved childcare and early-education service in Australia,
							with NQS quality ratings, approved places and care types, synced
							daily from ACECQA.
						</p>

						<div className="mt-9">
							<DirectorySearchHero />
						</div>

						<div className="flex flex-wrap gap-2 justify-center mt-6 text-[13px]">
							<span className="text-muted-foreground">Browse by state:</span>
							{STATE_LINKS.map(([label, slug]) => (
								<Link
									key={slug}
									href={`/childcare/${slug}`}
									className="font-semibold text-teal-700 hover:underline"
								>
									{label}
								</Link>
							))}
						</div>
					</div>
				</section>

				<MarketingSections popular={popular} categories={categories} />
			</main>
			<SiteFooter />
		</div>
	);
}
