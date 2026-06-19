import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSuburbPage, getNearbySuburbs, stateName } from "@/lib/directory";
import { SuburbDirectory } from "@/components/directory/suburb-directory";

// ISR: render on first request, cache, refresh daily (matches the ACECQA sync cadence).
export const revalidate = 86400;

type Params = Promise<{ place: string; postcode: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { place, postcode } = await params;
	const data = await getSuburbPage({ suburb: place, postcode });
	if (!data) return { title: "Childcare | Kindello" };
	const where = `${data.suburbName}, ${data.state} ${postcode}`;
	return {
		title: `Childcare in ${where} (${data.stats.total} approved ${data.stats.total === 1 ? "centre" : "centres"}) | Kindello`,
		description: `Compare ${data.stats.total} approved childcare services in ${where}${
			data.state ? ` (${stateName(data.state) ?? data.state})` : ""
		}. NQS ratings, approved places, hours and contact details.`,
		alternates: { canonical: `/childcare/${place}/${postcode}` },
	};
}

export default async function SuburbPage({
	params,
	searchParams,
}: {
	params: Params;
	searchParams: Promise<{ rating?: string }>;
}) {
	const { place, postcode } = await params;
	const { rating } = await searchParams;
	const data = await getSuburbPage({
		suburb: place,
		postcode,
		minRating: rating,
	});
	if (!data) notFound();
	const nearby = data.center
		? await getNearbySuburbs(data.center, postcode)
		: [];
	return (
		<SuburbDirectory
			data={data}
			nearby={nearby}
			suburbSlug={place}
			rating={rating ?? ""}
		/>
	);
}
