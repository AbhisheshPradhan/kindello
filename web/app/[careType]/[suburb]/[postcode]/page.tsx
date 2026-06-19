import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	getSuburbPage,
	getNearbySuburbs,
	isCareTypeSlug,
	stateName,
	CARE_TYPES,
} from "@/lib/directory";
import { SuburbDirectory } from "@/components/directory/suburb-directory";

// Root-level care-type pages, e.g. /long-day-care/eastwood/2122. The static /childcare,
// /centre, /search, /finder folders take precedence; this catches the care-type slugs and
// 404s anything else.
export const revalidate = 86400;

type Params = Promise<{ careType: string; suburb: string; postcode: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { careType, suburb, postcode } = await params;
	if (!isCareTypeSlug(careType)) return {};
	const data = await getSuburbPage({ suburb, postcode, careType });
	if (!data) return {};
	const ct = CARE_TYPES[careType];
	const where = `${data.suburbName}, ${data.state} ${postcode}`;
	return {
		title: `${ct.plural} in ${where} (${data.stats.total} ${data.stats.total === 1 ? "service" : "services"}) | Kindello`,
		description: `Approved ${ct.label.toLowerCase()} in ${where}${
			data.state ? ` (${stateName(data.state) ?? data.state})` : ""
		}. NQS ratings, approved places, hours and contact details.`,
		alternates: { canonical: `/${careType}/${suburb}/${postcode}` },
	};
}

export default async function CareTypePage({
	params,
	searchParams,
}: {
	params: Params;
	searchParams: Promise<{ rating?: string; sort?: string }>;
}) {
	const { careType, suburb, postcode } = await params;
	if (!isCareTypeSlug(careType)) notFound();
	const { rating, sort } = await searchParams;
	const data = await getSuburbPage({
		suburb,
		postcode,
		careType,
		minRating: rating,
		sort: sort as "rating" | "places" | "name" | undefined,
	});
	if (!data) notFound();
	const nearby = data.center
		? await getNearbySuburbs(data.center, postcode)
		: [];
	return (
		<SuburbDirectory
			data={data}
			nearby={nearby}
			suburbSlug={suburb}
			rating={rating ?? ""}
			sort={sort ?? "rating"}
		/>
	);
}
