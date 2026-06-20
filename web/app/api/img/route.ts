import { pool } from "@/lib/db";

// Same-origin image proxy for operator-website photos/logos. The card requests
// /api/img?id=<service>&kind=photo|logo; we look the stored URL up in
// services_meta (never trust a URL from the query string — that'd be an open
// proxy), fetch it server-side (dodges hotlink/referer blocks), and stream it
// back with cache headers. This is also the takedown lever: drop the row's
// photo/logo and the image stops serving.
export const runtime = "nodejs";

const UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");
	const kind = searchParams.get("kind") === "logo" ? "logo" : "photo";
	// photo index for the detail gallery (defaults to the hero, index 0); clamped 0-9.
	const i = Math.min(Math.max(parseInt(searchParams.get("i") || "0", 10) || 0, 0), 9);
	if (!id) return new Response("missing id", { status: 400 });

	const { rows } = await pool.query<{ url: string | null }>(
		kind === "logo"
			? `SELECT logo_url AS url FROM services_meta WHERE service_approval_number = $1`
			: `SELECT photos->($2::int)->>'url' AS url FROM services_meta WHERE service_approval_number = $1`,
		kind === "logo" ? [id] : [id, i],
	);
	const src = rows[0]?.url;
	if (!src || !/^https?:\/\//.test(src))
		return new Response("not found", { status: 404 });

	try {
		const upstream = await fetch(src, {
			headers: { "user-agent": UA, accept: "image/*" },
			signal: AbortSignal.timeout(8000),
		});
		const type = upstream.headers.get("content-type") || "";
		if (!upstream.ok || !upstream.body || !type.startsWith("image/"))
			return new Response("upstream not an image", { status: 502 });
		return new Response(upstream.body, {
			headers: {
				"content-type": type,
				// Browser + CDN cache; these URLs are stable until the next crawl.
				"cache-control":
					"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
			},
		});
	} catch {
		return new Response("fetch failed", { status: 502 });
	}
}
