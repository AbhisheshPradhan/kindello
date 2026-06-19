import { searchSuburbs } from "@/lib/directory";

// Homepage search typeahead. Called after >=3 chars (the client debounces).
export const runtime = "nodejs"; // pg needs Node

export async function GET(req: Request) {
	const term = new URL(req.url).searchParams.get("term") ?? "";
	if (term.trim().length < 3) return Response.json([]);
	try {
		return Response.json(await searchSuburbs(term, 8));
	} catch (e) {
		console.error("/api/location-autocomplete error:", e);
		return Response.json([], { status: 500 });
	}
}
