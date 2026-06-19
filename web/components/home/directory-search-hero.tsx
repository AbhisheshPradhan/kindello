"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds/icon";

// Traditional directory search: type a suburb/postcode → resolve to its landing page.
// (The AI chat hero is preserved in home-experience.tsx; this is the swapped-in default.)
export function DirectorySearchHero() {
	const router = useRouter();
	const [q, setQ] = useState("");
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState("");

	async function submit() {
		const t = q.trim();
		if (!t || loading) return;
		setLoading(true);
		setErr("");
		try {
			const res = await fetch(`/api/resolve-place?q=${encodeURIComponent(t)}`);
			const data = (await res.json()) as {
				slug?: string;
				postcode?: string;
			} | null;
			if (data?.slug && data?.postcode) {
				router.push(`/childcare/${data.slug}/${data.postcode}`);
			} else {
				setErr("We couldn't find that suburb. Try a nearby suburb or postcode.");
				setLoading(false);
			}
		} catch {
			setErr("Something went wrong. Please try again.");
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-2xl">
			<div className="flex items-center gap-2 rounded-full border border-border bg-card shadow-md pl-4 pr-1.5 py-1.5 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
				<Icon name="map-pin" size={18} className="text-teal-500 shrink-0" />
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && submit()}
					placeholder="Suburb or postcode — e.g. Parramatta or 2150"
					className="flex-1 bg-transparent text-[16px] py-2 focus:outline-none placeholder:text-muted-foreground"
					aria-label="Search childcare by suburb or postcode"
				/>
				<button
					type="button"
					onClick={submit}
					disabled={loading || !q.trim()}
					className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 text-white px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50 hover:bg-teal-600 transition-colors"
				>
					<Icon name="search" size={15} />
					{loading ? "…" : "Search"}
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
