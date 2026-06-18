"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ds/icon";

const TYPES = [
	{ value: "", label: "All care types" },
	{ value: "long_day_care", label: "Long day care" },
	{ value: "family_day_care", label: "Family day care" },
	{ value: "preschool", label: "Preschool & kindy" },
	{ value: "oshc", label: "Outside school hours" },
];

const RATINGS = [
	{ value: "", label: "Any rating" },
	{ value: "Meeting NQS", label: "Meeting NQS or better" },
	{ value: "Exceeding NQS", label: "Exceeding NQS or better" },
	{ value: "Excellent", label: "Excellent only" },
];

const SELECT_WRAP = "relative inline-flex items-center";
const SELECT_CLASS =
	"appearance-none bg-card border border-border rounded-full py-2.25 pr-8.5 pl-4 font-sans text-sm font-medium text-body cursor-pointer outline-none shadow-xs";

/** Filter bar for the results grid — updates the URL query, server re-queries. */
export function SearchFilters() {
	const router = useRouter();
	const params = useSearchParams();
	const [suburb, setSuburb] = useState(params.get("suburb") ?? "");

	function update(key: string, value: string) {
		const next = new URLSearchParams(params.toString());
		if (value) next.set(key, value);
		else next.delete(key);
		router.push(`/search?${next.toString()}`);
	}

	function submitSuburb(e: React.FormEvent) {
		e.preventDefault();
		update("suburb", suburb.trim());
	}

	return (
		<div className="flex flex-wrap gap-2.5 items-center">
			<form
				onSubmit={submitSuburb}
				className={SELECT_WRAP}
			>
				<span className="absolute left-3.5 text-muted-foreground pointer-events-none">
					<Icon
						name="map-pin"
						size={16}
					/>
				</span>
				<input
					value={suburb}
					onChange={(e) => setSuburb(e.target.value)}
					placeholder="Suburb or town"
					className="bg-card border border-border rounded-full py-2.25 pr-4 pl-9.5 font-sans text-sm text-foreground outline-none shadow-xs min-w-45"
				/>
			</form>

			<div className={SELECT_WRAP}>
				<select
					aria-label="Care type"
					value={params.get("type") ?? ""}
					onChange={(e) => update("type", e.target.value)}
					className={SELECT_CLASS}
				>
					{TYPES.map((t) => (
						<option
							key={t.value}
							value={t.value}
						>
							{t.label}
						</option>
					))}
				</select>
				<span className="absolute right-3 text-muted-foreground pointer-events-none">
					<Icon
						name="chevron-down"
						size={15}
					/>
				</span>
			</div>

			<div className={SELECT_WRAP}>
				<select
					aria-label="Minimum rating"
					value={params.get("minRating") ?? ""}
					onChange={(e) => update("minRating", e.target.value)}
					className={SELECT_CLASS}
				>
					{RATINGS.map((r) => (
						<option
							key={r.value}
							value={r.value}
						>
							{r.label}
						</option>
					))}
				</select>
				<span className="absolute right-3 text-muted-foreground pointer-events-none">
					<Icon
						name="chevron-down"
						size={15}
					/>
				</span>
			</div>
		</div>
	);
}
