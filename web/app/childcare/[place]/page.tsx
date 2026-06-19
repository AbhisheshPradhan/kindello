import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateHub } from "@/lib/directory";
import { StateHub } from "@/components/directory/state-hub";

// /childcare/<state> — state hub. The [place] segment here is a state code (nsw, vic, …);
// a non-state value 404s. (Suburb pages live one level deeper: /childcare/<suburb>/<postcode>.)
export const revalidate = 86400;

type Params = Promise<{ place: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { place } = await params;
	const hub = await getStateHub(place);
	if (!hub) return { title: "Childcare | Kindello" };
	return {
		title: `Childcare in ${hub.name} (${hub.total.toLocaleString()} approved centres) | Kindello`,
		description: `Browse ${hub.total.toLocaleString()} approved childcare services across ${hub.suburbCount.toLocaleString()} suburbs in ${hub.name}. NQS ratings, approved places and maps by suburb.`,
		alternates: { canonical: `/childcare/${place.toLowerCase()}` },
	};
}

export default async function StateHubPage({ params }: { params: Params }) {
	const { place } = await params;
	const hub = await getStateHub(place);
	if (!hub) notFound();
	return <StateHub hub={hub} />;
}
