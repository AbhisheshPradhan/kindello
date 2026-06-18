import type { Metadata } from "next";
import {
	getPopularCentres,
	getCategoryCounts,
	getTotalCount,
} from "@/lib/directory";
import { HomeExperience } from "@/components/home/home-experience";

export const metadata: Metadata = {
	title: "Kindello: find approved childcare anywhere in Australia",
	description:
		"Search every approved childcare and early-education service in Australia in plain English. Compare NQS quality ratings, approved places and care types, synced daily from ACECQA.",
	alternates: { canonical: "/" },
	openGraph: {
		title: "Kindello: find the right childcare, faster",
		description:
			"Ask in plain English. Kindello searches every approved service in Australia by location, care type and quality rating.",
		type: "website",
	},
};

// Real ACECQA spine data is fetched server-side for SEO; the chat is layered on
// as an ephemeral client state (per the design-system homepage spec).
export default async function HomePage() {
	const [popular, categories, total] = await Promise.all([
		getPopularCentres(4),
		getCategoryCounts(),
		getTotalCount(),
	]);

	return (
		<HomeExperience
			popular={popular}
			categories={categories}
			total={total}
		/>
	);
}
