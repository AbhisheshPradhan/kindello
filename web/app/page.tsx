import type { Metadata } from "next";
import {
	getPopularCentres,
	getCategoryCounts,
	getTotalCount,
} from "@/lib/directory";
import { DirectoryHome } from "@/components/home/directory-home";
// Preserved AI chat homepage — swap the render below back to <HomeExperience> to flip.
// import { HomeExperience } from "@/components/home/home-experience";

export const metadata: Metadata = {
	title: "Kindello: find approved childcare anywhere in Australia",
	description:
		"Search every approved childcare and early-education service in Australia by suburb. Compare NQS quality ratings, approved places and care types, synced daily from ACECQA.",
	alternates: { canonical: "/" },
	openGraph: {
		title: "Kindello: find the right childcare near you",
		description:
			"Search every approved childcare service in Australia by suburb, care type and NQS quality rating.",
		type: "website",
	},
};

// Real ACECQA spine data is fetched server-side for SEO. Classic directory homepage:
// location search → suburb landing pages, plus browse sections.
export default async function HomePage() {
	const [popular, categories, total] = await Promise.all([
		getPopularCentres(4),
		getCategoryCounts(),
		getTotalCount(),
	]);

	return (
		<DirectoryHome popular={popular} categories={categories} total={total} />
	);
}
