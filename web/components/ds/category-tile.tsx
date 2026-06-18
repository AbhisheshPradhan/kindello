"use client";

import type { AnchorHTMLAttributes, CSSProperties } from "react";
import { Icon, type IconName } from "./icon";

type Tone = "teal" | "coral" | "sun";

/**
 * CategoryTile — "Browse by type" tile. Icon in a soft tinted square, label,
 * optional count. Renders as an anchor; hover raises + tints the border.
 */
export function CategoryTile({
	icon = "baby",
	label = "Long Day Care",
	count = null,
	tone = "teal",
	style,
	...props
}: {
	icon?: IconName;
	label?: string;
	count?: number | null;
	tone?: Tone;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
	const tones: Record<Tone, { fg: string; bg: string }> = {
		teal: { fg: "var(--teal-600)", bg: "var(--teal-50)" },
		coral: { fg: "var(--coral-500)", bg: "var(--coral-100)" },
		sun: { fg: "var(--sun-500)", bg: "var(--sun-100)" },
	};
	const t = tones[tone];
	const css: CSSProperties = {
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-start",
		gap: 12,
		padding: "20px",
		textAlign: "left",
		textDecoration: "none",
		background: "var(--surface)",
		border: "1px solid var(--border)",
		borderRadius: "var(--radius-xl)",
		cursor: "pointer",
		boxShadow: "var(--shadow-xs)",
		transition: "all .18s ease",
		width: "100%",
		...style,
	};
	return (
		<a
			style={css}
			onMouseEnter={(e) => {
				e.currentTarget.style.boxShadow = "var(--shadow-md)";
				e.currentTarget.style.borderColor = t.fg;
				e.currentTarget.style.transform = "translateY(-2px)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.boxShadow = "var(--shadow-xs)";
				e.currentTarget.style.borderColor = "var(--border)";
				e.currentTarget.style.transform = "none";
			}}
			{...props}
		>
			<span
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 48,
					height: 48,
					borderRadius: "var(--radius-lg)",
					background: t.bg,
					color: t.fg,
				}}
			>
				<Icon
					name={icon}
					size={24}
				/>
			</span>
			<span style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>
				{label}
			</span>
			{count != null && (
				<span
					style={{
						fontSize: 13,
						color: "var(--muted-fg)",
						fontFamily: "var(--font-mono)",
					}}
				>
					{count.toLocaleString()} centres
				</span>
			)}
		</a>
	);
}
