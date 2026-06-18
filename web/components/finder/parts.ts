import type { UIMessage } from "ai";
import type { CareType, NqsRating, SearchState } from "@/lib/search-state";

// ---- read loosely-typed AI SDK stream parts ----

export function messageText(m: UIMessage): string {
	return m.parts
		.filter((p) => p.type === "text")
		.map((p) => (p as { text: string }).text)
		.join("");
}

function toolFollowUps(m: UIMessage): string[] {
	for (const p of m.parts) {
		if (p.type === "tool-suggestFollowUps") {
			const q = (p as { input?: { questions?: unknown } }).input?.questions;
			if (Array.isArray(q))
				return q.filter((x): x is string => typeof x === "string");
		}
	}
	return [];
}

// Weak models sometimes write follow-ups as prose instead of calling the tool; recover them.
function leakedFollowUps(text: string): { body: string; questions: string[] } {
	const m = text.match(/(^|\n)[^\n]*follow[\s-]?up questions?\b[^\n]*/i);
	if (!m || m.index == null) return { body: text, questions: [] };
	const cut = m.index + (m[1] ? 1 : 0);
	const body = text.slice(0, cut).trimEnd();
	const tail = text.slice(cut);
	const questions = (tail.match(/[^\n?]*\?/g) ?? [])
		.map((q) => q.replace(/^[\s\d.)*_>•-]+/, "").trim())
		.filter((q) => q.length > 6 && q.length <= 120);
	return { body, questions: questions.slice(0, 3) };
}

export function answerBody(m: UIMessage): string {
	return leakedFollowUps(messageText(m)).body;
}

export function followUpsFor(m: UIMessage): string[] {
	const tool = toolFollowUps(m);
	if (tool.length) return tool;
	return leakedFollowUps(messageText(m)).questions;
}

// Derive a SearchState delta from what the model just did this turn (resolved a location,
// ran a search with filters). This is how the AI keeps the canonical state + filter chips
// in sync: the model manipulates filters, we mirror them into SearchState, then the canvas
// re-runs deterministically. Returns null if the turn didn't touch the search.
export function deltaFromAssistant(m: UIMessage): Partial<SearchState> | null {
	const delta: Partial<SearchState> = {};
	let touched = false;

	for (const p of m.parts) {
		if (
			p.type === "tool-resolveLocation" &&
			(p as { state?: string }).state === "output-available"
		) {
			const o = (p as { output?: { lat?: number; lng?: number; label?: string } })
				.output;
			if (o && typeof o.lat === "number" && typeof o.lng === "number") {
				delta.location = { lat: o.lat, lng: o.lng, label: o.label ?? "your area" };
				touched = true;
			}
		}
		if (p.type === "tool-searchCentres") {
			const inp = (
				p as {
					input?: {
						latitude?: number;
						longitude?: number;
						radius_km?: number;
						care_type?: string;
						min_rating?: string;
						keyword?: string;
					};
				}
			).input;
			if (inp) {
				// Deliberately DON'T mirror radius_km: radius is a user-owned filter (the
				// radius chip), and the model often picks a narrow radius for "near"/"close
				// to", which would silently shrink the chip + result set "by itself".
				delta.careType = (inp.care_type as CareType) ?? null;
				delta.minRating = (inp.min_rating as NqsRating) ?? null;
				delta.keyword = inp.keyword ?? null;
				// If the model searched without first resolving (reused coords), capture them.
				if (
					!delta.location &&
					typeof inp.latitude === "number" &&
					typeof inp.longitude === "number"
				) {
					delta.location = {
						lat: inp.latitude,
						lng: inp.longitude,
						label: "your area",
					};
				}
				touched = true;
			}
		}
	}
	return touched ? delta : null;
}
