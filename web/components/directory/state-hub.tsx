import Link from "next/link";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { PlaceResultCard } from "@/components/ds/place-result-card";
import { Icon } from "@/components/ds/icon";
import type { StateHub as StateHubData } from "@/lib/directory";

// State hub = a landing/navigation page (intro + browse links + top centres). NOT a
// results+map page — that's the suburb level.
export function StateHub({ hub }: { hub: StateHubData }) {
	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<SiteHeader />
			<main className="flex-1">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
					<nav className="text-[12.5px] text-muted-foreground mb-4 flex items-center gap-1.5">
						<Link href="/" className="hover:text-teal-700">
							Home
						</Link>
						<span>/</span>
						<span className="text-body">{hub.name}</span>
					</nav>

					<h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-foreground">
						Childcare in {hub.name}
					</h1>
					<p className="mt-2 max-w-2xl text-[15px] text-muted-foreground leading-relaxed">
						{hub.total.toLocaleString()} approved childcare and early-education
						services across {hub.suburbCount.toLocaleString()} suburbs in{" "}
						{hub.name}. Pick a suburb to see centres, NQS ratings and approved
						places on a map.
					</p>

					{/* Browse suburbs — the internal-link graph */}
					<section className="mt-7">
						<h2 className="text-[18px] font-semibold text-foreground mb-3 flex items-center gap-2">
							<Icon name="map-pin" size={16} />
							Popular suburbs
						</h2>
						<div className="flex flex-wrap gap-2">
							{hub.topSuburbs.map((s) => (
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

					{/* Top-rated centres */}
					{hub.topCentres.length > 0 && (
						<section className="mt-10">
							<h2 className="text-[18px] font-semibold text-foreground mb-3 flex items-center gap-2">
								<Icon name="sparkles" size={16} />
								Top-rated centres in {hub.name}
							</h2>
							<div className="grid gap-4 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4">
								{hub.topCentres.map((c) => (
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
										href={`/centre/${c.id}`}
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
