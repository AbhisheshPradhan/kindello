import Link from "next/link";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
	{
		heading: "Browse",
		links: [
			{ label: "Long day care", href: "/search?type=long_day_care" },
			{ label: "Family day care", href: "/search?type=family_day_care" },
			{ label: "Preschool & kindy", href: "/search?type=preschool" },
			{ label: "Outside school hours care", href: "/search?type=oshc" },
		],
	},
	{
		heading: "Locations",
		links: [
			{ label: "Sydney", href: "/search?suburb=Surry%20Hills" },
			{ label: "Melbourne", href: "/search?suburb=Carlton" },
			{ label: "Brisbane", href: "/search?suburb=South%20Brisbane" },
			{ label: "Perth", href: "/search?suburb=Fremantle" },
		],
	},
	{
		heading: "For parents",
		links: [
			{ label: "Guides", href: "/#guides" },
			{ label: "How ratings work", href: "/#guides" },
			{ label: "Child Care Subsidy", href: "/#guides" },
			{ label: "About Kindello", href: "/#about" },
		],
	},
	{
		heading: "For centres",
		links: [
			{ label: "List your centre", href: "/list-your-centre" },
			{ label: "Claim your listing", href: "/list-your-centre" },
			{ label: "Data & API", href: "/list-your-centre" },
		],
	},
];

/** SiteFooter — light teal-tint footer with brand mark, link columns, ACECQA attribution. */
export function SiteFooter() {
	return (
		<footer className="bg-teal-tint border-t">
			<div className="ds-container pt-14 pb-10">
				<div className="grid gap-10 items-start grid-cols-1 min-[721px]:grid-cols-[minmax(220px,1.4fr)_repeat(2,minmax(120px,1fr))]">
					<div className="max-w-80">
						<span className="inline-flex items-center gap-2.25">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src="/brand/kindello-mark-clean.png"
								alt="Kindello"
								className="h-7.5 w-auto"
							/>
							<span className="text-[21px] font-semibold tracking-[-0.02em] text-primary">
								Kindello
							</span>
						</span>
						<p className="mt-3.5 text-sm leading-[1.6] text-body">
							Every approved childcare and early-education service
							in Australia, in plain English. Quality ratings
							sourced from ACECQA and synced daily.
						</p>
					</div>

					<div className="grid grid-cols-2 gap-8">
						{COLS.map((col) => (
							<div key={col.heading}>
								<h4 className="text-xs font-semibold tracking-[.05em] uppercase text-muted-foreground mb-3">
									{col.heading}
								</h4>
								<ul className="list-none m-0 p-0 flex flex-col gap-2.25">
									{col.links.map((l) => (
										<li key={l.label}>
											<Link
												href={l.href}
												className="text-sm text-body no-underline"
											>
												{l.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="mt-10 pt-5 border-t flex flex-wrap gap-3 items-center justify-between text-[13px] text-muted-foreground">
					<span>
						© {new Date().getFullYear()} Kindello. Quality ratings
						sourced from ACECQA.
					</span>
					<span className="inline-flex gap-4.5">
						<Link
							href="/#about"
							className="text-muted-foreground no-underline"
						>
							Privacy
						</Link>
						<Link
							href="/#about"
							className="text-muted-foreground no-underline"
						>
							Terms
						</Link>
					</span>
				</div>
			</div>
		</footer>
	);
}
