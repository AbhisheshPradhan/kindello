"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds/icon";

// Care types kept client-side (static); lib/directory is server-only.
const CARE_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "All care types" },
	{ value: "long-day-care", label: "Childcare centre" },
	{ value: "preschool", label: "Preschool & kindergarten" },
	{ value: "before-school-care", label: "Before school care" },
	{ value: "after-school-care", label: "After school care" },
	{ value: "vacation-care", label: "Vacation care" },
	{ value: "family-day-care", label: "Family day care" },
];
const RATING_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "Any NQS rating" },
	{ value: "Meeting NQS", label: "Meeting NQS & above" },
	{ value: "Exceeding NQS", label: "Exceeding NQS & above" },
	{ value: "Excellent", label: "Excellent only" },
];
const SORT_OPTIONS: { value: string; label: string }[] = [
	{ value: "rating", label: "Top rated" },
	{ value: "places", label: "Most places" },
	{ value: "name", label: "By name" },
];

type Suggestion = {
	suburb: string;
	slug: string;
	postcode: string;
	state: string;
	count: number;
};

// The sticky search + filter row on suburb/care-type pages. Care type navigates to its
// landing path; rating/sort update query params (server re-filters). Location search jumps
// to another suburb.
export function ResultsToolbar({
	suburbSlug,
	postcode,
	careType,
	rating,
	sort,
}: {
	suburbSlug: string;
	postcode: string;
	careType: string; // "" = all
	rating: string; // "" = any
	sort: string; // "rating" default
}) {
	const router = useRouter();
	const [q, setQ] = useState("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [open, setOpen] = useState(false);
	const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const abort = useRef<AbortController | undefined>(undefined);

	useEffect(() => {
		const t = q.trim();
		if (t.length < 3) {
			setSuggestions([]);
			setOpen(false);
			return;
		}
		clearTimeout(debounce.current);
		debounce.current = setTimeout(async () => {
			abort.current?.abort();
			const ac = new AbortController();
			abort.current = ac;
			try {
				const res = await fetch(
					`/api/location-autocomplete?term=${encodeURIComponent(t)}`,
					{ signal: ac.signal },
				);
				const data = (await res.json()) as Suggestion[];
				setSuggestions(Array.isArray(data) ? data : []);
				setOpen(true);
			} catch {
				/* ignore */
			}
		}, 250);
		return () => clearTimeout(debounce.current);
	}, [q]);

	const basePath = careType
		? `/${careType}/${suburbSlug}/${postcode}`
		: `/childcare/${suburbSlug}/${postcode}`;

	function push(path: string, next: { rating?: string; sort?: string }) {
		const r = next.rating !== undefined ? next.rating : rating;
		const s = next.sort !== undefined ? next.sort : sort;
		const sp = new URLSearchParams();
		if (r) sp.set("rating", r);
		if (s && s !== "rating") sp.set("sort", s);
		const qs = sp.toString();
		router.push(qs ? `${path}?${qs}` : path);
	}

	return (
		<div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
			<div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2.5">
				{/* Location search */}
				<div className="relative flex-1 min-w-55 max-w-90">
					<div className="flex items-center gap-1.5 rounded-full border border-border bg-card pl-3 pr-1 py-1 focus-within:border-teal-300">
						<Icon name="map-pin" size={15} className="text-teal-500 shrink-0" />
						<input
							value={q}
							onChange={(e) => setQ(e.target.value)}
							onFocus={() => suggestions.length > 0 && setOpen(true)}
							onBlur={() => setTimeout(() => setOpen(false), 120)}
							placeholder="Search another suburb or postcode"
							className="flex-1 min-w-0 bg-transparent text-[14px] py-1 focus:outline-none placeholder:text-muted-foreground"
							aria-label="Search another suburb or postcode"
							autoComplete="off"
						/>
						<span className="inline-flex items-center justify-center rounded-full bg-secondary w-7 h-7 shrink-0">
							<Icon name="search" size={14} className="text-muted-foreground" />
						</span>
					</div>
					{open && suggestions.length > 0 && (
						<ul className="absolute z-40 left-0 right-0 top-[calc(100%+0.4rem)] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
							{suggestions.map((s) => (
								<li key={`${s.slug}-${s.postcode}`}>
									<button
										type="button"
										onMouseDown={() =>
											router.push(
												careType
													? `/${careType}/${s.slug}/${s.postcode}`
													: `/childcare/${s.slug}/${s.postcode}`,
											)
										}
										className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-secondary"
									>
										<Icon name="map-pin" size={14} className="text-muted-foreground shrink-0" />
										<span className="text-[14px] text-foreground">{s.suburb}</span>
										<span className="text-[12.5px] text-muted-foreground">
											{s.state} {s.postcode}
										</span>
										<span className="ml-auto text-[12px] text-muted-foreground">{s.count}</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2 ml-auto">
					<Pill
						label="Care type"
						value={careType}
						options={CARE_OPTIONS}
						onChange={(v) =>
							push(
								v
									? `/${v}/${suburbSlug}/${postcode}`
									: `/childcare/${suburbSlug}/${postcode}`,
								{},
							)
						}
					/>
					<Pill
						label="NQS rating"
						value={rating}
						options={RATING_OPTIONS}
						onChange={(v) => push(basePath, { rating: v })}
					/>
					<Pill
						label="Sort"
						value={sort}
						options={SORT_OPTIONS}
						onChange={(v) => push(basePath, { sort: v })}
					/>
				</div>
			</div>
		</div>
	);
}

function Pill({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: { value: string; label: string }[];
	onChange: (v: string) => void;
}) {
	const active = value !== "" && value !== "rating";
	return (
		<label
			className={`relative inline-flex items-center rounded-full border text-[13px] font-medium leading-none ${
				active
					? "bg-teal-50 border-teal-200 text-teal-700"
					: "bg-card border-border text-body"
			}`}
		>
			<span className="sr-only">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="appearance-none bg-transparent pl-3 pr-7 py-2 rounded-full cursor-pointer focus:outline-none"
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			<Icon
				name="chevron-down"
				size={13}
				className="pointer-events-none absolute right-2.5 opacity-60"
			/>
		</label>
	);
}
