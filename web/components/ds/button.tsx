"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
	sm: "h-[34px] px-3.5 text-sm gap-1.5",
	md: "h-[42px] px-5 text-[15px] gap-2",
	lg: "h-[50px] px-7 text-base gap-2",
};

const VARIANTS: Record<Variant, string> = {
	primary:
		"bg-primary text-white border border-transparent shadow-teal hover:bg-teal-600",
	accent: "bg-coral-500 text-white border border-transparent shadow-coral hover:bg-coral-600",
	secondary:
		"bg-secondary text-foreground border border-transparent hover:opacity-85",
	outline: "bg-card text-foreground border border-border hover:bg-secondary",
	ghost: "bg-transparent text-foreground border border-transparent hover:bg-secondary",
};

/**
 * Kindello Button — the action primitive. `primary` is teal, `accent` is the
 * coral high-intent CTA (Enquire, Find care) with a soft glow.
 */
export function Button({
	variant = "primary",
	size = "md",
	full = false,
	iconLeft = null,
	iconRight = null,
	className,
	children,
	...props
}: {
	variant?: Variant;
	size?: Size;
	full?: boolean;
	iconLeft?: ReactNode;
	iconRight?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className={cn(
				"inline-flex items-center justify-center font-sans font-semibold leading-none rounded-md whitespace-nowrap transition-[background,opacity,box-shadow] duration-150",
				SIZES[size],
				VARIANTS[variant],
				full ? "w-full" : "w-auto",
				className,
			)}
			{...props}
		>
			{iconLeft}
			{children}
			{iconRight}
		</button>
	);
}
