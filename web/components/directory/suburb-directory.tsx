import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { SuburbResults, type CareLink } from "./suburb-results";
import {
	CARE_TYPES,
	stateName,
	type CareTypeSlug,
	type SuburbLink,
	type SuburbPage,
} from "@/lib/directory";

// Build the suburb's care-type navigation links (server-side: lib/directory is server-only).
function buildCareLinks(data: SuburbPage): CareLink[] {
	const base = `${data.suburbName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${data.postcode}`;
	return [
		{
			href: `/childcare/${base}`,
			label: "All childcare",
			n: data.stats.total,
			active: data.careType === null,
		},
		...(Object.keys(CARE_TYPES) as CareTypeSlug[]).map((slug) => ({
			href: `/${slug}/${base}`,
			label: CARE_TYPES[slug].label,
			n: data.stats.byCare[slug],
			active: data.careType === slug,
		})),
	].filter((i) => i.n > 0);
}

export function SuburbDirectory({
	data,
	nearby,
	suburbSlug,
	rating,
}: {
	data: SuburbPage;
	nearby: SuburbLink[];
	suburbSlug: string;
	rating: string;
}) {
	const { suburbName, state, postcode, careType, stats } = data;
	const stateLong = state ? (stateName(state) ?? state) : "";
	const headingPrefix = careType ? CARE_TYPES[careType].label : "Childcare";
	const heading = `${headingPrefix} in ${suburbName}, ${state} ${postcode}`;

	const introSuburb = `There ${stats.total === 1 ? "is" : "are"} ${stats.total} approved ${
		careType ? `${CARE_TYPES[careType].label.toLowerCase()} ` : ""
	}${stats.total === 1 ? "service" : "services"} in and around ${suburbName} (${postcode})${
		stateLong ? `, ${stateLong}` : ""
	}. ${
		stats.exceeding > 0
			? `${stats.exceeding} rated Exceeding NQS or above`
			: "None are rated Exceeding NQS or above yet"
	}${
		stats.totalPlaces > 0
			? `, with around ${stats.totalPlaces.toLocaleString()} approved places in total.`
			: "."
	}`;

	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<SiteHeader />

			{/* The toolbar (sticky), list and map all live in the client island so the
			    "Map Area" search-this-area state is shared across them. */}
			<SuburbResults
				data={data}
				nearby={nearby}
				suburbSlug={suburbSlug}
				rating={rating}
				stateLong={stateLong}
				heading={heading}
				headingPrefix={headingPrefix}
				introSuburb={introSuburb}
				careLinks={buildCareLinks(data)}
			/>
			<SiteFooter />
		</div>
	);
}
