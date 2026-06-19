import { resolvePlace } from "@/lib/directory";

// Homepage search hero → resolve a typed suburb/postcode to its canonical landing page.
export const runtime = "nodejs"; // pg needs Node

export async function GET(req: Request) {
	const q = new URL(req.url).searchParams.get("q") ?? "";
	if (!q.trim()) return Response.json(null);
	try {
		return Response.json(await resolvePlace(q));
	} catch (e) {
		console.error("/api/resolve-place error:", e);
		return Response.json(null, { status: 500 });
	}
}
