"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PromptChip — suggested-prompt pill for the hero search ("Long day care
 * near me", "Open weekends"). Rounded, hover lifts to a teal tint.
 */
export function PromptChip({
	className,
	children,
	...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className={cn(
				"inline-flex items-center gap-1.5 px-4 py-2.25 font-sans text-sm font-medium text-body bg-card border border-border rounded-full shadow-xs transition-all duration-150",
				"hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}
