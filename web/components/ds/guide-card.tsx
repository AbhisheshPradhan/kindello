"use client";

import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const GRADS = [
	"linear-gradient(120deg, #57c5c5, #1ca6a6)",
	"linear-gradient(120deg, #ffd766, #ff8166)",
	"linear-gradient(120deg, #2fb3b3, #136d6d)",
];

/**
 * GuideCard — parent-guide article card. Gradient thumbnail, category eyebrow,
 * title, read-time. Renders as an anchor.
 */
export function GuideCard({
	title = "How to read an NQS rating",
	category = "Choosing care",
	readTime = "5 min read",
	seed = 0,
	className,
	...props
}: {
	title?: string;
	category?: string;
	readTime?: string;
	seed?: number;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
	return (
		<a
			className={cn(
				"flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-180 hover:shadow-md hover:-translate-y-0.5",
				className,
			)}
			{...props}
		>
			{/* Data-driven gradient thumbnail — stays inline. */}
			<div
				className="h-37.5"
				style={{ background: GRADS[seed % GRADS.length] }}
			/>
			<div className="px-4.5 pt-4 pb-5 flex flex-col gap-2">
				<span className="text-xs font-semibold tracking-[.04em] uppercase text-teal-600">
					{category}
				</span>
				<h3 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground leading-[1.3] m-0">
					{title}
				</h3>
				<span className="text-[13px] text-muted-foreground">
					{readTime}
				</span>
			</div>
		</a>
	);
}
