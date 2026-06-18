"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
			className="flex items-center gap-4 px-4 sm:px-6 py-3 sticky top-0 z-30 backdrop-blur-[10px] border-b"
			style={{
				background: "color-mix(in srgb, var(--bg) 88%, transparent)",
			}}
		>
			<Link
				href="/"
				onClick={onLogoClick}
				className="inline-flex items-center gap-2.25 no-underline"
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="/brand/kindello-mark-clean.png"
					alt="Kindello"
					className="h-7.5 w-auto block"
				/>
				<span className="text-[21px] font-semibold tracking-[-0.02em] text-primary">
					Kindello
				</span>
			</Link>

			<nav className="hidden min-[820px]:flex items-center gap-0.5 ml-3.5">
				{NAV.map((n) => {
					const active = pathname === n.href;
					return (
						<Link
							key={n.label}
							href={n.href}
							className={cn(
								"px-3 py-2 text-[14.5px] font-medium rounded-md no-underline",
								active ? "text-primary" : "text-body",
							)}
						>
							{n.label}
						</Link>
					);
				})}
			</nav>

			<span className="flex-1" />

			<ThemeToggle />
			<Link
				href="/search"
				className="hidden min-[820px]:inline-flex text-sm font-semibold text-body px-3.5 py-2 no-underline"
			>
				Sign in
			</Link>
			<Link
				href="/list-your-centre"
				className="text-sm font-semibold text-white bg-primary px-4 py-2.25 rounded-md shadow-teal no-underline whitespace-nowrap"
			>
				List your centre
			</Link>
		</header>
	);
}
