import {
	getAreaCentres,
	isCareTypeSlug,
	type CareTypeSlug,
	type SortKey,
} from "@/lib/directory";

// "Search this area" on the suburb-page map: deterministic Postgres radius query at the
// panned map centre, returning the same DirectoryCentre shape the page renders. No model,
// no token cost — the directory twin of /api/search, but in the directory's data shape.
export const runtime = "nodejs"; // pg needs Node
export const maxDuration = 30;

type Body = {
	lat?: number;
	lng?: number;
	radiusKm?: number;
	careType?: string | null;
	minRating?: string | null;
	sort?: string | null;
};

export async function POST(req: Request) {
	let body: Body;
	try {
		body = (await req.json()) as Body;
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	const { lat, lng, radiusKm } = body;
	if (
		!Number.isFinite(lat) ||
		!Number.isFinite(lng) ||
		!Number.isFinite(radiusKm)
	) {
		return Response.json(
			{ error: "lat, lng and radiusKm are required numbers." },
			{ status: 400 },
		);
	}

	const careType: CareTypeSlug | null =
		body.careType && isCareTypeSlug(body.careType) ? body.careType : null;
	const sort: SortKey | undefined =
		body.sort === "rating" || body.sort === "places" || body.sort === "name"
			? body.sort
			: undefined;

	try {
		const result = await getAreaCentres({
			lat: lat as number,
			lng: lng as number,
			radiusKm: Math.max(1, Math.min(30, radiusKm as number)),
			careType,
			minRating: body.minRating ?? null,
			sort,
		});
		return Response.json(result);
	} catch (e) {
		console.error("/api/directory-area error:", e);
		return Response.json({ error: "Search failed. Try again." }, { status: 500 });
	}
}
