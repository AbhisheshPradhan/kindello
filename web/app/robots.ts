import type { MetadataRoute } from "next";

// Index the directory; keep the parked AI experiment (/finder, /chat) and APIs out.
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/", "/finder", "/chat"],
		},
		sitemap: "https://kindello.com.au/sitemap.xml",
	};
}
