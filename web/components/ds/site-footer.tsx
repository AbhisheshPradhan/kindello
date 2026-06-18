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
		<footer
			style={{
				background: "var(--teal-tint)",
				borderTop: "1px solid var(--border)",
			}}
		>
			<div
				className="ds-container"
				style={{ padding: "56px 24px 40px" }}
			>
				<div
					style={{
						display: "grid",
						gap: 40,
						gridTemplateColumns:
							"minmax(220px, 1.4fr) repeat(2, minmax(120px, 1fr))",
						alignItems: "start",
					}}
					className="ds-footer-grid"
				>
					<div style={{ maxWidth: 320 }}>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 9,
							}}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src="/brand/kindello-mark-clean.png"
								alt="Kindello"
								style={{ height: 30, width: "auto" }}
							/>
							<span
								style={{
									fontSize: 21,
									fontWeight: 600,
									letterSpacing: "-0.02em",
									color: "var(--color-primary)",
								}}
							>
								Kindello
							</span>
						</span>
						<p
							style={{
								marginTop: 14,
								fontSize: 14,
								lineHeight: 1.6,
								color: "var(--text-body)",
							}}
						>
							Every approved childcare and early-education service
							in Australia, in plain English. Quality ratings
							sourced from ACECQA and synced daily.
						</p>
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(2, 1fr)",
							gap: 32,
						}}
						className="ds-footer-links"
					>
						{COLS.map((col) => (
							<div key={col.heading}>
								<h4
									style={{
										fontSize: 12,
										fontWeight: 600,
										letterSpacing: ".05em",
										textTransform: "uppercase",
										color: "var(--muted-fg)",
										marginBottom: 12,
									}}
								>
									{col.heading}
								</h4>
								<ul
									style={{
										listStyle: "none",
										margin: 0,
										padding: 0,
										display: "flex",
										flexDirection: "column",
										gap: 9,
									}}
								>
									{col.links.map((l) => (
										<li key={l.label}>
											<Link
												href={l.href}
												style={{
													fontSize: 14,
													color: "var(--text-body)",
													textDecoration: "none",
												}}
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

				<div
					style={{
						marginTop: 40,
						paddingTop: 20,
						borderTop: "1px solid var(--border)",
						display: "flex",
						flexWrap: "wrap",
						gap: 12,
						alignItems: "center",
						justifyContent: "space-between",
						fontSize: 13,
						color: "var(--muted-fg)",
					}}
				>
					<span>
						© {new Date().getFullYear()} Kindello. Quality ratings
						sourced from ACECQA.
					</span>
					<span style={{ display: "inline-flex", gap: 18 }}>
						<Link
							href="/#about"
							style={{
								color: "var(--muted-fg)",
								textDecoration: "none",
							}}
						>
							Privacy
						</Link>
						<Link
							href="/#about"
							style={{
								color: "var(--muted-fg)",
								textDecoration: "none",
							}}
						>
							Terms
						</Link>
					</span>
				</div>
			</div>
		</footer>
	);
}
