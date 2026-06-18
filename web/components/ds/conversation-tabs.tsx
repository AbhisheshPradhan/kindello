"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

/**
 * ConversationTabs — the single Answer ⇄ Places toggle that owns a whole
 * conversation, with a "New search" action on the right. Sticky-capable so it
 * pins under the site header as the thread scrolls.
 */
export function ConversationTabs({
	active = "answer",
	placesCount = null,
	onSelect,
	onNewSearch,
	sticky = false,
	top = 59,
	style,
}: {
	active?: "answer" | "places";
	placesCount?: number | null;
	onSelect: (id: "answer" | "places") => void;
	onNewSearch?: (() => void) | null;
	sticky?: boolean;
	top?: number;
	style?: CSSProperties;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
	const [indicator, setIndicator] = useState<{
		left: number;
		width: number;
	} | null>(null);

	const showPlaces = placesCount != null && placesCount > 0;

	// Measure the active tab and slide a single underline bar to it. useLayoutEffect
	// (pre-paint) so it lands in place on mount without a flash, then transitions on
	// every `active` change. Re-measures when the Places tab appears/disappears or
	// the container resizes.
	useLayoutEffect(() => {
		const measure = () => {
			const btn = tabRefs.current[active];
			const container = containerRef.current;
			if (!btn || !container) return;
			const b = btn.getBoundingClientRect();
			const c = container.getBoundingClientRect();
			setIndicator({ left: b.left - c.left, width: b.width });
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [active, showPlaces]);

	const tab = (
		id: "answer" | "places",
		label: string,
		icon: IconName,
		count: number | null,
	) => {
		const on = active === id;
		return (
			<button
				ref={(el) => {
					tabRefs.current[id] = el;
				}}
				onClick={() => onSelect(id)}
				className={cn(
					"inline-flex items-center gap-2 py-3.5 px-0.5 font-sans text-[14.5px] font-semibold bg-transparent transition-colors",
					on ? "text-foreground" : "text-muted-foreground",
				)}
			>
				<Icon
					name={icon}
					size={15}
				/>
				{label}
				{count != null && (
					<span
						className={cn(
							"text-[11px] px-1.5 py-px rounded-full transition-colors",
							on
								? "bg-teal-50 text-teal-700"
								: "bg-secondary text-muted-foreground",
						)}
					>
						{count}
					</span>
				)}
			</button>
		);
	};

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative flex items-center gap-7.5 border-b",
				sticky && "sticky z-15 bg-background pt-4.5",
			)}
			style={{ ...(sticky ? { top } : {}), ...style }}
		>
			{tab("answer", "Answer", "sparkles", null)}
			{showPlaces && tab("places", "Places", "map-pin", placesCount)}
			{indicator && (
				<span
					aria-hidden
					className="absolute -bottom-px h-0.5 bg-teal-500 rounded-full transition-[transform,width] duration-300 ease-out"
					style={{
						transform: `translateX(${indicator.left}px)`,
						width: indicator.width,
					}}
				/>
			)}
			{onNewSearch && (
				<button
					onClick={onNewSearch}
					className="ml-auto mb-1.75 inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-body bg-card border border-border rounded-md px-3.25 py-1.75"
				>
					<Icon
						name="search"
						size={14}
					/>{" "}
					New search
				</button>
			)}
		</div>
	);
}
