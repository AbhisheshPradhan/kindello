"use client";

import type { CSSProperties } from "react";
import { Icon } from "./icon";

/**
 * ContinueSearchCard — a recent-search card for the homepage resting state's
 * "Pick up where you left off" section. Mini-map thumbnail (pins), recency, the
 * past query, a result summary, and a Continue affordance. Resting state only.
 */
export function ContinueSearchCard({
	query = "Long day care for a 2 year old near Surry Hills",
	summary = "6 centres · 3 with places now",
	when = "2 days ago",
	pins = [
		[30, 50],
		[54, 40],
		[46, 66],
	],
	onResume,
	style,
}: {
	query?: string;
	summary?: string;
	when?: string;
	pins?: [number, number][];
	onResume?: () => void;
	style?: CSSProperties;
}) {
	return (
		<button
			onClick={onResume}
			className="flex flex-col text-left p-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-[box-shadow,transform,border-color] duration-180 hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5"
			style={style}
		>
			<div
				className="h-29 relative"
				style={{
					background:
						"color-mix(in srgb, var(--teal-500) 8%, var(--secondary))",
				}}
			>
				<div className="absolute left-0 right-0 top-[54%] h-0.5 bg-card" />
				<div className="absolute top-0 bottom-0 left-[38%] w-0.5 bg-card" />
				{pins.map(([x, y], i) => (
					<span
						key={i}
						className="absolute"
						style={{
							left: `${x}%`,
							top: `${y}%`,
							transform: "translate(-50%,-100%)",
						}}
					>
						<span className="block w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,.3)]" />
					</span>
				))}
			</div>
			<div className="px-4 pt-3.75 pb-4 flex flex-col gap-2.5 flex-1">
				<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
					<Icon
						name="clock"
						size={13}
					/>{" "}
					{when}
				</span>
				<span className="text-[15.5px] font-semibold text-foreground leading-[1.4]">
					{query}
				</span>
				<span className="text-[13px] text-muted-foreground">
					{summary}
				</span>
				<span className="mt-auto inline-flex items-center justify-center gap-1.75 p-2.5 rounded-md bg-teal-50 text-teal-700 text-sm font-semibold">
					Continue{" "}
					<Icon
						name="chevron-right"
						size={15}
					/>
				</span>
			</div>
		</button>
	);
}
