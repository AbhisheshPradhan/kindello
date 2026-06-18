"use client";

import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

type Tone = "teal" | "coral" | "sun";

const TONES: Record<Tone, { box: string; hoverBorder: string }> = {
	teal: {
		box: "bg-teal-50 text-teal-600",
		hoverBorder: "hover:border-teal-600",
	},
	coral: {
		box: "bg-coral-100 text-coral-500",
		hoverBorder: "hover:border-coral-500",
	},
	sun: {
		box: "bg-sun-100 text-sun-500",
		hoverBorder: "hover:border-sun-500",
	},
};

/**
 * CategoryTile — "Browse by type" tile. Icon in a soft tinted square, label,
 * optional count. Renders as an anchor; hover raises + tints the border.
 */
export function CategoryTile({
	icon = "baby",
	label = "Long Day Care",
	count = null,
	tone = "teal",
	className,
	...props
}: {
	icon?: IconName;
	label?: string;
	count?: number | null;
	tone?: Tone;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
	const t = TONES[tone];
	return (
		<a
			className={cn(
				"flex flex-col items-start gap-3 p-5 text-left w-full bg-card border border-border rounded-xl shadow-xs transition-all duration-180 hover:shadow-md hover:-translate-y-0.5",
				t.hoverBorder,
				className,
			)}
			{...props}
		>
			<span
				className={cn(
					"inline-flex items-center justify-center w-12 h-12 rounded-lg",
					t.box,
				)}
			>
				<Icon
					name={icon}
					size={24}
				/>
			</span>
			<span className="text-base font-semibold text-foreground">
				{label}
			</span>
			{count != null && (
				<span className="text-[13px] text-muted-foreground font-mono">
					{count.toLocaleString()} centres
				</span>
			)}
		</a>
	);
}
