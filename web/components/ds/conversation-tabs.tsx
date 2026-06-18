"use client";

import type { CSSProperties } from "react";
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
	const tab = (
		id: "answer" | "places",
		label: string,
		icon: IconName,
		count: number | null,
	) => {
		const on = active === id;
		return (
			<button
				onClick={() => onSelect(id)}
				className={cn(
					"inline-flex items-center gap-2 py-3.5 px-0.5 -mb-px font-sans text-[14.5px] bg-none border-none border-b-2",
					on
						? "font-semibold text-foreground border-teal-500"
						: "font-medium text-muted-foreground border-transparent",
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
							"text-[11px] px-1.5 py-px rounded-full",
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
			className={cn(
				"flex items-center gap-7.5 border-b",
				sticky && "sticky z-15 bg-background pt-4.5",
			)}
			style={{ ...(sticky ? { top } : {}), ...style }}
		>
			{tab("answer", "Answer", "sparkles", null)}
			{placesCount != null &&
				placesCount > 0 &&
				tab("places", "Places", "map-pin", placesCount)}
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
