"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import {
	CARE_TYPE_LABEL,
	DEFAULT_LOCATION,
	SIZE_LABEL,
	SORT_LABEL,
	type CareType,
	type CentreSize,
	type NqsRating,
	type SearchState,
	type SortKey,
} from "@/lib/search-state";
import type { Facets } from "@/lib/search-core";

const RADII = [2, 5, 10, 15, 25];

// A native <select> dressed as a chip. `active` (a non-default value) flips it teal so the
// applied filters read at a glance — picking the "Any/All" option is how you remove one.
function PillSelect({
	label,
	value,
	active,
	onChange,
	children,
}: {
	label: string;
	value: string;
	active: boolean;
	onChange: (v: string) => void;
	children: React.ReactNode;
}) {
	return (
		<label
			className={cn(
				"relative inline-flex items-center rounded-full border text-[13px] font-medium leading-none transition-colors cursor-pointer shrink-0",
				active
					? "bg-teal-50 border-teal-200 text-teal-700"
					: "bg-card border-border text-body hover:border-muted-foreground/40",
			)}
		>
			<span className="sr-only">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="appearance-none bg-transparent pl-3 pr-7 py-1.75 rounded-full cursor-pointer focus:outline-none"
			>
				{children}
			</select>
			<Icon
				name="chevron-down"
				size={13}
				className="pointer-events-none absolute right-2.5 opacity-60"
			/>
		</label>
	);
}

export function CriteriaBar({
	state,
	facets,
	resolving = false,
	onChange,
	onResolve,
}: {
	state: SearchState;
	facets?: Facets | null;
	resolving?: boolean;
	onChange: (delta: Partial<SearchState>) => void;
	onResolve: (text: string) => void;
}) {
	const [loc, setLoc] = useState("");
	const [editing, setEditing] = useState(false);

	const submitLoc = () => {
		const t = loc.trim();
		if (t) onResolve(t);
		setEditing(false);
	};

	return (
		<div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5">
			{/* Location — the required anchor. Always set (clearing resets to the Sydney
			    default, never an empty map). Click the chip to type a new suburb. */}
			{state.location && !editing ? (
				<span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-teal-500 text-white text-[13px] font-semibold leading-none pl-1 pr-1.5 py-1.5">
					<button
						type="button"
						onClick={() => {
							setLoc("");
							setEditing(true);
						}}
						className="inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-1 py-0.5 hover:bg-white/15"
						title="Change location"
					>
						<Icon name="map-pin" size={13} />
						{state.location.label}
					</button>
					<button
						type="button"
						aria-label="Reset to Sydney"
						onClick={() => {
							onChange({ location: DEFAULT_LOCATION });
							setLoc("");
						}}
						className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full hover:bg-white/20"
					>
						<Icon name="x" size={12} />
					</button>
				</span>
			) : (
				<div className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-border bg-card pl-3 pr-1 py-1">
					<Icon name="map-pin" size={13} className="opacity-60" />
					<input
						autoFocus
						value={loc}
						onChange={(e) => setLoc(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") submitLoc();
							if (e.key === "Escape") setEditing(false);
						}}
						onBlur={() => setEditing(false)}
						placeholder="Suburb or postcode"
						className="bg-transparent text-[13px] w-36 focus:outline-none placeholder:text-muted-foreground"
					/>
					<button
						type="button"
						onMouseDown={(e) => e.preventDefault()} // keep focus so onBlur doesn't cancel first
						onClick={submitLoc}
						disabled={resolving || !loc.trim()}
						className="inline-flex items-center justify-center rounded-full bg-teal-500 text-white px-2.5 py-1.25 text-[12px] font-semibold disabled:opacity-40"
					>
						{resolving ? "…" : "Go"}
					</button>
				</div>
			)}

			{/* Filters only matter once anchored on a place. */}
			{state.location && (
				<>
					<PillSelect
						label="Care type"
						value={state.careType ?? ""}
						active={!!state.careType}
						onChange={(v) =>
							onChange({ careType: (v || null) as CareType | null })
						}
					>
						<option value="">Any care type</option>
						{(Object.keys(CARE_TYPE_LABEL) as CareType[]).map((c) => (
							<option key={c} value={c}>
								{CARE_TYPE_LABEL[c]}
							</option>
						))}
					</PillSelect>

					<PillSelect
						label="NQS rating"
						value={state.minRating ?? ""}
						active={!!state.minRating}
						onChange={(v) =>
							onChange({ minRating: (v || null) as NqsRating | null })
						}
					>
						<option value="">Any rating</option>
						<option value="Meeting NQS">Meeting NQS or above</option>
						<option value="Exceeding NQS">Exceeding NQS or above</option>
						<option value="Excellent">Excellent only</option>
					</PillSelect>

					<PillSelect
						label="Radius"
						value={String(state.radiusKm)}
						active={state.radiusKm !== 5}
						onChange={(v) => onChange({ radiusKm: Number(v) })}
					>
						{/* Presets, plus the current value if map navigation set an
						    off-preset radius (e.g. 7 km), so the chip shows it truthfully. */}
						{(RADII.includes(state.radiusKm)
							? RADII
							: [...RADII, state.radiusKm].sort((a, b) => a - b)
						).map((r) => (
							<option key={r} value={r}>
								Within {r} km
							</option>
						))}
					</PillSelect>

					<PillSelect
						label="Size"
						value={state.size ?? ""}
						active={!!state.size}
						onChange={(v) =>
							onChange({ size: (v || null) as CentreSize | null })
						}
					>
						<option value="">Any size</option>
						{(Object.keys(SIZE_LABEL) as CentreSize[]).map((s) => (
							<option key={s} value={s}>
								{SIZE_LABEL[s]}
							</option>
						))}
					</PillSelect>

					<PillSelect
						label="Sort"
						value={state.sort}
						active={state.sort !== "distance"}
						onChange={(v) => onChange({ sort: v as SortKey })}
					>
						{(Object.keys(SORT_LABEL) as SortKey[]).map((s) => (
							<option key={s} value={s}>
								Sort: {SORT_LABEL[s]}
							</option>
						))}
					</PillSelect>
				</>
			)}
		</div>
	);
}
