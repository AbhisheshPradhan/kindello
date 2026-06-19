import type { MetadataRoute } from "next";
import { getSitemapSuburbs, getStates } from "@/lib/directory";

const BASE = "https://kindello.com.au";

// Indexable surfaces: home + state hubs + suburb pages + the care-type pages that exist.
// (Centre detail pages are reachable via internal links; a separate centre sitemap can be
// added later via generateSitemaps if needed.) Refreshed daily.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [subs, states] = await Promise.all([getSitemapSuburbs(), getStates()]);
	const urls: MetadataRoute.Sitemap = [
		{ url: BASE, changeFrequency: "weekly", priority: 1 },
	];
	for (const s of states) {
		urls.push({
			url: `${BASE}/childcare/${s.toLowerCase()}`,
			changeFrequency: "weekly",
			priority: 0.8,
		});
	}
	for (const s of subs) {
		urls.push({ url: `${BASE}/childcare/${s.slug}/${s.postcode}`, priority: 0.7 });
		for (const ct of s.careTypes) {
			urls.push({ url: `${BASE}/${ct}/${s.slug}/${s.postcode}` });
		}
	}
	return urls;
}
