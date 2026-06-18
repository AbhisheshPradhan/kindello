"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
	{ label: "Browse", href: "/search" },
	{ label: "Locations", href: "/search?view=locations" },
	{ label: "Guides", href: "/#guides" },
	{ label: "About", href: "/#about" },
];

/**
 * SiteHeader — sticky directory header: teal brand mark + "Kindello" wordmark,
 * primary nav, Sign in, and the coral "List your centre" supply-side CTA.
 * Stays put when the homepage drops into chat mode so parents keep context.
 */
export function SiteHeader({ onLogoClick }: { onLogoClick?: () => void }) {
	const pathname = usePathname();

	return (
		<header
			style={{
				display: "flex",
				alignItems: "center",
				gap: 16,
				padding: "12px 24px",
				position: "sticky",
				top: 0,
				zIndex: 30,
				background: "color-mix(in srgb, var(--bg) 88%, transparent)",
				backdropFilter: "blur(10px)",
				WebkitBackdropFilter: "blur(10px)",
				borderBottom: "1px solid var(--border)",
			}}
		>
			<Link
				href="/"
				onClick={onLogoClick}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: 9,
					textDecoration: "none",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="/brand/kindello-mark-clean.png"
					alt="Kindello"
					style={{ height: 30, width: "auto", display: "block" }}
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
			</Link>

			<nav
				style={{
					display: "none",
					alignItems: "center",
					gap: 2,
					marginLeft: 14,
				}}
				className="ds-header-nav"
			>
				{NAV.map((n) => {
					const active = pathname === n.href;
					return (
						<Link
							key={n.label}
							href={n.href}
							style={{
								padding: "8px 12px",
								fontSize: 14.5,
								fontWeight: 500,
								color: active
									? "var(--color-primary)"
									: "var(--text-body)",
								borderRadius: "var(--radius-md)",
								textDecoration: "none",
							}}
						>
							{n.label}
						</Link>
					);
				})}
			</nav>

			<span style={{ flex: 1 }} />

			<ThemeToggle />
			<Link
				href="/search"
				style={{
					display: "none",
					fontSize: 14,
					fontWeight: 600,
					color: "var(--text-body)",
					padding: "8px 14px",
					textDecoration: "none",
				}}
				className="ds-header-signin"
			>
				Sign in
			</Link>
			<Link
				href="/list-your-centre"
				style={{
					fontSize: 14,
					fontWeight: 600,
					color: "#fff",
					background: "var(--color-primary)",
					padding: "9px 16px",
					borderRadius: "var(--radius-md)",
					boxShadow: "var(--shadow-teal)",
					textDecoration: "none",
					whiteSpace: "nowrap",
				}}
			>
				List your centre
			</Link>
		</header>
	);
}
