"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds/icon";

// Care types kept client-side (static) since lib/directory is server-only.
const CARE_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "All care types" },
	{ value: "long-day-care", label: "Long day care (childcare centre)" },
	{ value: "preschool", label: "Preschool & kindergarten" },
	{ value: "before-school-care", label: "Before school care" },
	{ value: "after-school-care", label: "After school care" },
	{ value: "vacation-care", label: "Vacation care" },
	{ value: "family-day-care", label: "Family day care" },
];

type Suggestion = {
	suburb: string;
	slug: string;
	postcode: string;
	state: string;
	count: number;
};

// Traditional directory search: care-type dropdown + suburb/postcode box with a debounced
// autocomplete (fires after 3 chars). Picking a suggestion routes to its landing page.
// (The AI chat hero is preserved in home-experience.tsx.)
export function DirectorySearchHero() {
	const router = useRouter();
	const [careType, setCareType] = useState("");
	const [q, setQ] = useState("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");
	const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const abort = useRef<AbortController | undefined>(undefined);

	// Debounced typeahead — only after 3 chars, and we cancel the in-flight request on
	// each keystroke so we never race redundant calls.
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
				/* aborted or failed — ignore */
			}
		}, 250);
		return () => clearTimeout(debounce.current);
	}, [q]);

	function go(s: Suggestion) {
		router.push(
			careType
				? `/${careType}/${s.slug}/${s.postcode}`
				: `/childcare/${s.slug}/${s.postcode}`,
		);
	}

	// Search button / Enter: use the top suggestion, else resolve the typed text.
	async function submit() {
		if (suggestions[0]) return go(suggestions[0]);
		const t = q.trim();
		if (!t || busy) return;
		setBusy(true);
		setErr("");
		try {
			const res = await fetch(`/api/resolve-place?q=${encodeURIComponent(t)}`);
			const d = (await res.json()) as Suggestion | null;
			if (d?.slug && d?.postcode) return go(d);
			setErr("We couldn't find that suburb. Try a nearby suburb or postcode.");
		} catch {
			setErr("Something went wrong. Please try again.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="relative mx-auto max-w-2xl text-left">
			<div className="flex items-center rounded-full border border-border bg-card shadow-md pl-1.5 pr-1.5 py-1.5 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
				{/* Care-type dropdown */}
				<div className="relative shrink-0">
					<select
						value={careType}
						onChange={(e) => setCareType(e.target.value)}
						aria-label="Care type"
						className="appearance-none bg-transparent rounded-full pl-3.5 pr-8 py-2.5 text-[14px] font-semibold text-body cursor-pointer focus:outline-none w-44 truncate"
					>
						{CARE_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
					<Icon
						name="chevron-down"
						size={14}
						className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60"
					/>
				</div>

				<span className="w-px h-6 bg-border mx-1 shrink-0" />

				{/* Location field — the autocomplete dropdown is anchored here, so it sits
				    below the location only (not the whole bar). */}
				<div className="relative flex-1 flex items-center min-w-0">
					<Icon name="map-pin" size={18} className="text-teal-500 shrink-0 ml-2" />
					<input
						value={q}
						onChange={(e) => {
							setQ(e.target.value);
							setErr("");
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") submit();
							if (e.key === "Escape") setOpen(false);
						}}
						onFocus={() => suggestions.length > 0 && setOpen(true)}
						onBlur={() => setTimeout(() => setOpen(false), 120)}
						placeholder="Enter your suburb or postcode"
						className="flex-1 min-w-0 bg-transparent text-[16px] px-2.5 py-2 focus:outline-none placeholder:text-muted-foreground"
						aria-label="Search by suburb or postcode"
						autoComplete="off"
					/>
					{open && suggestions.length > 0 && (
						<ul className="absolute z-20 left-0 right-0 top-[calc(100%+0.9rem)] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
							{suggestions.map((s) => (
								<li key={`${s.slug}-${s.postcode}`}>
									<button
										type="button"
										// onMouseDown fires before the input's onBlur closes the list.
										onMouseDown={() => go(s)}
										className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-secondary"
									>
										<Icon name="map-pin" size={15} className="text-muted-foreground shrink-0" />
										<span className="text-[15px] text-foreground">{s.suburb}</span>
										<span className="text-[13px] text-muted-foreground">
											{s.state} {s.postcode}
										</span>
										<span className="ml-auto text-[12.5px] text-muted-foreground">
											{s.count} {s.count === 1 ? "centre" : "centres"}
										</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<button
					type="button"
					onClick={submit}
					disabled={busy || !q.trim()}
					className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 text-white px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50 hover:bg-teal-600 transition-colors shrink-0"
				>
					<Icon name="search" size={15} />
					{busy ? "…" : "Search"}
				</button>
			</div>

			{err && (
				<p className="mt-2.5 text-[13.5px] text-rating-improve text-center">
					{err}
				</p>
			)}
		</div>
	);
}
