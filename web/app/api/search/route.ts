import { runSearch, resolveLocationText } from "@/lib/search-core";
import { defaultSearchState, type SearchState } from "@/lib/search-state";

// Deterministic search — the chip/filter path. No model, no streaming, no token cost: a
// chip edit or a typed suburb hits this and gets rows + facets straight from Postgres.
// This is the "old-school directory filter" half of the hybrid; /api/chat is the AI half,
// and BOTH go through the same lib/search-core, so they can never disagree.
export const runtime = "nodejs"; // pg needs Node
export const maxDuration = 30;

type Body = {
	// Either resolve a typed location first…
	resolve?: string;
	// …or run a full search from a (partial) state.
	state?: Partial<SearchState>;
};

export async function POST(req: Request) {
	let body: Body;
	try {
		body = (await req.json()) as Body;
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	// Location lookup for the filter-first path (typing a suburb into the location chip).
	if (body.resolve != null) {
		const loc = await resolveLocationText(body.resolve);
		return Response.json(loc);
	}

	const state: SearchState = { ...defaultSearchState(), ...(body.state ?? {}) };
	if (!state.location) {
		return Response.json(
			{ error: "Pick a location first." },
			{ status: 400 },
		);
	}

	try {
		const result = await runSearch(state);
		return Response.json(result);
	} catch (e) {
		console.error("/api/search error:", e);
		return Response.json(
			{ error: "Search failed. Try again." },
			{ status: 500 },
		);
	}
}
