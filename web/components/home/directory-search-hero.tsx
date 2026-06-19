"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds/icon";

// Care types kept client-side (static) since lib/directory is server-only.
const CARE_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "All care types" },
	{ value: "long-day-care", label: "Childcare centre" },
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
	const [careOpen, setCareOpen] = useState(false);
	const careRef = useRef<HTMLDivElement>(null);
	const [q, setQ] = useState("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [open, setOpen] = useState(false);
	// The suggestion the user picked from the dropdown. Search is enabled only once this is
	// set (we require a real, valid place — no free-text guessing).
	const [selected, setSelected] = useState<Suggestion | null>(null);
	const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const abort = useRef<AbortController | undefined>(undefined);
	const justPicked = useRef(false);

	// Debounced typeahead — only after 3 chars, and we cancel the in-flight request on
	// each keystroke so we never race redundant calls.
	useEffect(() => {
		// Picking a suggestion rewrites the input; don't reopen the dropdown for that.
		if (justPicked.current) {
			justPicked.current = false;
			return;
		}
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

	// Close the care-type dropdown on outside click / Escape.
	useEffect(() => {
		if (!careOpen) return;
		function onDown(e: MouseEvent) {
			if (careRef.current && !careRef.current.contains(e.target as Node)) {
				setCareOpen(false);
			}
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setCareOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [careOpen]);

	const careLabel =
		CARE_OPTIONS.find((o) => o.value === careType)?.label ?? "All care types";

	function go(s: Suggestion) {
		router.push(
			careType
				? `/${careType}/${s.slug}/${s.postcode}`
				: `/childcare/${s.slug}/${s.postcode}`,
		);
	}

	// Pick a suggestion: fill the input + remember it, but DON'T navigate (Search does).
	function pick(s: Suggestion) {
		setSelected(s);
		justPicked.current = true;
		setQ(`${s.suburb}, ${s.state} ${s.postcode}`);
		setSuggestions([]);
		setOpen(false);
	}

	// Search / Enter only acts on a picked suggestion (button is disabled otherwise).
	function submit() {
		if (selected) go(selected);
	}

	return (
		<div className="relative mx-auto max-w-2xl text-left">
			{/* Mobile: 1-col stacked card (care type / location / full-width Search).
			    sm+: the horizontal rounded pill. */}
			<div className="flex flex-col sm:flex-row sm:items-center rounded-2xl sm:rounded-full border border-border bg-card shadow-md p-1.5 sm:pl-1.5 sm:pr-1.5 sm:py-1.5 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
				{/* Care-type dropdown — custom (not native <select>) so the open list is
				    brand-styled and fully tappable on mobile. */}
				<div ref={careRef} className="relative w-full sm:w-auto shrink-0">
					<button
						type="button"
						onClick={() => setCareOpen((v) => !v)}
						aria-haspopup="listbox"
						aria-expanded={careOpen}
						aria-label="Care type"
						className="flex items-center justify-between gap-2 bg-transparent rounded-full pl-3.5 pr-3 py-2.5 text-[14px] font-semibold text-body cursor-pointer focus:outline-none w-full sm:w-44"
					>
						<span className="truncate">{careLabel}</span>
						<Icon
							name="chevron-down"
							size={14}
							className={`shrink-0 opacity-60 transition-transform ${careOpen ? "rotate-180" : ""}`}
						/>
					</button>
					{careOpen && (
						<ul
							role="listbox"
							className="absolute z-30 left-0 top-[calc(100%+0.2rem)] w-full sm:w-64 rounded-xl border border-border bg-card shadow-lg overflow-hidden py-1"
						>
							{CARE_OPTIONS.map((o) => (
								<li key={o.value} role="option" aria-selected={careType === o.value}>
									<button
										type="button"
										onClick={() => {
											setCareType(o.value);
											setCareOpen(false);
										}}
										className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[15px] hover:bg-secondary ${
											careType === o.value
												? "font-semibold text-teal-600"
												: "text-foreground"
										}`}
									>
										<span className="flex-1">{o.label}</span>
										{careType === o.value && (
											<Icon name="check" size={15} className="text-teal-600 shrink-0" />
										)}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<span className="h-px w-full bg-border sm:h-6 sm:w-px sm:mx-1 shrink-0" />

				{/* Location field — the autocomplete dropdown is anchored here, so it sits
				    below the location only (not the whole bar). */}
				<div className="relative flex-1 flex items-center min-w-0 w-full">
					<Icon name="map-pin" size={18} className="text-teal-500 shrink-0 ml-2" />
					<input
						value={q}
						onChange={(e) => {
							setQ(e.target.value);
							setSelected(null);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") submit();
							if (e.key === "Escape") setOpen(false);
						}}
						onFocus={() => suggestions.length > 0 && setOpen(true)}
						onBlur={() => setTimeout(() => setOpen(false), 120)}
						placeholder="Enter your suburb or postcode"
						className="flex-1 min-w-0 bg-transparent text-[16px] px-2.5 py-5 sm:py-2 focus:outline-none placeholder:text-muted-foreground"
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
										onMouseDown={() => pick(s)}
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
					disabled={!selected}
					className="mt-1.5 w-full justify-center sm:mt-0 sm:w-auto sm:justify-start inline-flex items-center gap-1.5 rounded-full bg-teal-500 text-white px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors shrink-0"
				>
					<Icon name="search" size={15} />
					Search
				</button>
			</div>
		</div>
	);
}
