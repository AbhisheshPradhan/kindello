import "server-only";
import { pool } from "./db";
// Pure slug helpers live in ./slugs (client-safe); used here + re-exported so existing
// server imports from "@/lib/directory" keep working.
import { suburbSlug, centreSlug, centrePath } from "./slugs";
export { suburbSlug, centreSlug, centrePath };

// ---------------------------------------------------------------------------
// Server-side directory data access for the indexable surfaces (homepage
// "Popular near you", search results grid, centre detail). The chat path keeps
// using lib/tools.ts against the same Postgres; this module is the read layer
// for the marketing/SEO pages.
//
// Honesty note: review *counts and star scores are representative placeholders*
// — Google Places (reviews/photos) is Tier-2 enrichment we haven't loaded yet
// (see CLAUDE.md). They're derived deterministically from each centre's real
// NQS tier + id so they're stable per centre and ready to swap for real Places
// data. Everything else on these cards (name, address, suburb, NQS rating,
// approved places, hours, phone) is real ACECQA spine data.
// ---------------------------------------------------------------------------

export type DirectoryCentre = {
	id: string;
	name: string;
	address: string | null;
	suburb: string | null;
	state: string | null;
	postcode: string | null;
	rating: string | null; // raw ACECQA NQS rating
	places: number | null;
	phone: string | null;
	lat: number | null;
	lng: number | null;
	operatingHours: Record<
		string,
		Record<string, { start?: string; end?: string }>
	> | null;
	flags: CareFlags;
	// representative (see note above)
	stars: number;
	reviews: number;
	tags: string[];
	seed: number;
};

type CareFlags = {
	ldc: boolean;
	preschoolStandalone: boolean;
	preschoolSchool: boolean;
	oshcBefore: boolean;
	oshcAfter: boolean;
	oshcVacation: boolean;
	familyDayCare: boolean;
};

type Row = {
	service_approval_number: string;
	service_name: string;
	service_address: string | null;
	suburb: string | null;
	state: string | null;
	postcode: string | null;
	overall_rating: string | null;
	number_of_approved_places: number | null;
	phone: string | null;
	latitude: number | null;
	longitude: number | null;
	operating_hours: DirectoryCentre["operatingHours"];
	service_type: string | null;
	is_long_day_care: boolean | null;
	is_preschool_stand_alone: boolean | null;
	is_preschool_part_of_school: boolean | null;
	is_oshc_before_school: boolean | null;
	is_oshc_after_school: boolean | null;
	is_oshc_vacation_care: boolean | null;
};

const SELECT = `
  service_approval_number, service_name, service_address, suburb, state, postcode,
  overall_rating, number_of_approved_places, nullif(phone,'') AS phone,
  latitude::float8 AS latitude, longitude::float8 AS longitude, operating_hours, service_type,
  is_long_day_care, is_preschool_stand_alone, is_preschool_part_of_school,
  is_oshc_before_school, is_oshc_after_school, is_oshc_vacation_care`;

// Stable small integer from an id, for gradient/photo seeds + representative figures.
function hashSeed(id: string): number {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
	return h;
}

// Representative star score anchored to the real NQS tier (swap for Places data).
function nqsStars(rating: string | null, seed: number): number {
	const base =
		rating === "Excellent"
			? 4.9
			: rating === "Exceeding NQS"
				? 4.7
				: rating === "Meeting NQS"
					? 4.4
					: rating === "Working Towards NQS"
						? 4.0
						: 4.2;
	const jitter = ((seed % 5) - 2) * 0.05; // ±0.1, deterministic
	return Math.round(Math.min(5, Math.max(3.6, base + jitter)) * 10) / 10;
}

function reviewCount(seed: number): number {
	return 18 + (seed % 240);
}

function careTags(row: Row): string[] {
	const tags: string[] = [];
	if (row.is_long_day_care) tags.push("Long day care");
	if (row.is_preschool_stand_alone || row.is_preschool_part_of_school)
		tags.push("Preschool");
	if (
		row.is_oshc_before_school ||
		row.is_oshc_after_school ||
		row.is_oshc_vacation_care
	)
		tags.push("OSHC");
	if (row.service_type === "Family Day Care") tags.push("Family day care");
	if (!tags.length) tags.push("Early learning");
	if (row.number_of_approved_places != null)
		tags.push(`${row.number_of_approved_places} places`);
	return tags.slice(0, 3);
}

function toCentre(row: Row): DirectoryCentre {
	const seed = hashSeed(row.service_approval_number);
	return {
		id: row.service_approval_number,
		name: titleCase(row.service_name ?? "Childcare centre"),
		address: row.service_address ? titleCase(row.service_address) : null,
		suburb: row.suburb ? titleCase(row.suburb) : null,
		state: row.state,
		postcode: row.postcode,
		rating: row.overall_rating,
		places: row.number_of_approved_places,
		phone: row.phone,
		lat: row.latitude,
		lng: row.longitude,
		operatingHours: row.operating_hours,
		flags: {
			ldc: !!row.is_long_day_care,
			preschoolStandalone: !!row.is_preschool_stand_alone,
			preschoolSchool: !!row.is_preschool_part_of_school,
			oshcBefore: !!row.is_oshc_before_school,
			oshcAfter: !!row.is_oshc_after_school,
			oshcVacation: !!row.is_oshc_vacation_care,
			familyDayCare: row.service_type === "Family Day Care",
		},
		stars: nqsStars(row.overall_rating, seed),
		reviews: reviewCount(seed),
		tags: careTags(row),
		seed,
	};
}

// ACECQA names/addresses are UPPERCASE; soften to title case for display.
export function titleCase(s: string): string {
	return s
		.toLowerCase()
		.replace(/\b([a-z])/g, (m) => m.toUpperCase())
		.replace(
			/\b(Nsw|Vic|Qld|Wa|Sa|Nt|Act|Tas|Oshc|Pcyc|Ymca|Bgs)\b/gi,
			(m) => m.toUpperCase(),
		);
}

const CARE_PREDICATES: Record<string, string> = {
	long_day_care: "is_long_day_care",
	preschool: "(is_preschool_stand_alone OR is_preschool_part_of_school)",
	oshc: "(is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care)",
	family_day_care: "service_type = 'Family Day Care'",
};

const RATING_ORDER = [
	"Significant Improvement Required",
	"Working Towards NQS",
	"Meeting NQS",
	"Exceeding NQS",
	"Excellent",
] as const;

/** Highly-rated, geocoded, sizeable centres for the homepage "Popular near you" grid. */
export async function getPopularCentres(limit = 4): Promise<DirectoryCentre[]> {
	const { rows } = await pool.query<Row>(
		`SELECT ${SELECT} FROM services
     WHERE overall_rating IN ('Excellent','Exceeding NQS')
       AND latitude IS NOT NULL AND number_of_approved_places >= 30
       AND service_name IS NOT NULL AND suburb IS NOT NULL
     ORDER BY (overall_rating = 'Excellent') DESC, number_of_approved_places DESC, service_approval_number
     LIMIT $1`,
		[limit],
	);
	return rows.map(toCentre);
}

export type CategoryCount = {
	key: string;
	label: string;
	icon: string;
	tone: "teal" | "coral" | "sun";
	count: number;
};

export async function getCategoryCounts(): Promise<CategoryCount[]> {
	const { rows } = await pool.query<{
		ldc: string;
		fdc: string;
		preschool: string;
		oshc: string;
	}>(
		`SELECT
       count(*) FILTER (WHERE is_long_day_care) AS ldc,
       count(*) FILTER (WHERE service_type = 'Family Day Care') AS fdc,
       count(*) FILTER (WHERE is_preschool_stand_alone OR is_preschool_part_of_school) AS preschool,
       count(*) FILTER (WHERE is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care) AS oshc
     FROM services`,
	);
	const r = rows[0];
	return [
		{
			key: "long_day_care",
			label: "Long day care",
			icon: "baby",
			tone: "teal",
			count: Number(r.ldc),
		},
		{
			key: "family_day_care",
			label: "Family day care",
			icon: "users",
			tone: "coral",
			count: Number(r.fdc),
		},
		{
			key: "preschool",
			label: "Preschool & kindy",
			icon: "graduation-cap",
			tone: "sun",
			count: Number(r.preschool),
		},
		{
			key: "oshc",
			label: "Outside school hours",
			icon: "blocks",
			tone: "teal",
			count: Number(r.oshc),
		},
		{
			key: "",
			label: "All services",
			icon: "sun",
			tone: "coral",
			count: Number(r.ldc) + Number(r.fdc),
		},
	];
}

export async function getTotalCount(): Promise<number> {
	const { rows } = await pool.query<{ n: string }>(
		`SELECT count(*) n FROM services`,
	);
	return Number(rows[0].n);
}

export async function getCentreById(
	id: string,
): Promise<DirectoryCentre | null> {
	const { rows } = await pool.query<Row>(
		`SELECT ${SELECT} FROM services WHERE service_approval_number = $1`,
		[id],
	);
	return rows[0] ? toCentre(rows[0]) : null;
}

export const QUALITY_AREAS = [
	"Educational program and practice",
	"Children's health and safety",
	"Physical environment",
	"Staffing arrangements",
	"Relationships with children",
	"Partnerships with families and communities",
	"Governance and leadership",
];

export type CentreDetail = DirectoryCentre & {
	qualityAreas: { area: number; label: string; rating: string | null }[];
	approvalDate: string | null;
	providerName: string | null;
};

export async function getCentreDetail(
	id: string,
): Promise<CentreDetail | null> {
	const { rows } = await pool.query<
		Row & {
			quality_area_1_rating: string | null;
			quality_area_2_rating: string | null;
			quality_area_3_rating: string | null;
			quality_area_4_rating: string | null;
			quality_area_5_rating: string | null;
			quality_area_6_rating: string | null;
			quality_area_7_rating: string | null;
			service_approval_granted_date: string | null;
			provider_legal_name: string | null;
		}
	>(
		`SELECT ${SELECT},
       quality_area_1_rating, quality_area_2_rating, quality_area_3_rating, quality_area_4_rating,
       quality_area_5_rating, quality_area_6_rating, quality_area_7_rating,
       service_approval_granted_date::text AS service_approval_granted_date, provider_legal_name
     FROM services WHERE service_approval_number = $1`,
		[id],
	);
	const r = rows[0];
	if (!r) return null;
	const base = toCentre(r);
	const qualityAreas = QUALITY_AREAS.map((label, i) => ({
		area: i + 1,
		label,
		rating:
			(r[`quality_area_${i + 1}_rating` as keyof typeof r] as
				| string
				| null) ?? null,
	}));
	return {
		...base,
		qualityAreas,
		approvalDate: r.service_approval_granted_date,
		providerName: r.provider_legal_name
			? titleCase(r.provider_legal_name)
			: null,
	};
}

/** Nearby centres for the detail page "related" rail (PostGIS distance). */
export async function getNearbyCentres(
	centre: DirectoryCentre,
	limit = 3,
): Promise<DirectoryCentre[]> {
	if (centre.lat == null || centre.lng == null) return [];
	const { rows } = await pool.query<Row>(
		`SELECT ${SELECT} FROM services
     WHERE geog IS NOT NULL AND service_approval_number <> $1
       AND ST_DWithin(geog, ST_MakePoint($2,$3)::geography, 8000)
     ORDER BY geog <-> ST_MakePoint($2,$3)::geography
     LIMIT $4`,
		[centre.id, centre.lng, centre.lat, limit],
	);
	return rows.map(toCentre);
}

export type SearchParams = {
	suburb?: string;
	type?: string;
	minRating?: string;
	limit?: number;
};

export type SearchResult = {
	centres: DirectoryCentre[];
	locationLabel: string | null;
	total: number;
};

/** Results-grid query: resolve a suburb to a centroid, then nearest-first within it. */
export async function searchDirectory({
	suburb,
	type,
	minRating,
	limit = 24,
}: SearchParams): Promise<SearchResult> {
	let lat: number | null = null;
	let lng: number | null = null;
	let locationLabel: string | null = null;

	if (suburb && suburb.trim()) {
		const s = suburb.trim();
		const { rows } = await pool.query<{
			state: string;
			lat: number;
			lng: number;
			n: number;
		}>(
			`SELECT state, avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*)::int n
       FROM services WHERE upper(suburb) = upper($1) AND latitude IS NOT NULL
       GROUP BY state ORDER BY n DESC LIMIT 1`,
			[s],
		);
		if (rows[0]?.n) {
			lat = rows[0].lat;
			lng = rows[0].lng;
			locationLabel = `${titleCase(s)}, ${rows[0].state}`;
		}
	}

	const where: string[] = [
		"latitude IS NOT NULL",
		"service_name IS NOT NULL",
	];
	const params: unknown[] = [];
	if (type && CARE_PREDICATES[type]) where.push(CARE_PREDICATES[type]);
	if (
		minRating &&
		RATING_ORDER.includes(minRating as (typeof RATING_ORDER)[number])
	) {
		const allowed = RATING_ORDER.slice(
			RATING_ORDER.indexOf(minRating as (typeof RATING_ORDER)[number]),
		);
		params.push(allowed);
		where.push(`overall_rating = ANY($${params.length})`);
	}

	let order =
		"number_of_approved_places DESC NULLS LAST, service_approval_number";
	if (lat != null && lng != null) {
		params.push(lng, lat);
		where.push(
			`geog IS NOT NULL AND ST_DWithin(geog, ST_MakePoint($${params.length - 1},$${params.length})::geography, 12000)`,
		);
		order = `geog <-> ST_MakePoint($${params.length - 1},$${params.length})::geography`;
	}
	params.push(limit);

	const { rows } = await pool.query<Row>(
		`SELECT ${SELECT} FROM services WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${params.length}`,
		params,
	);

	// Total matching (without the limit) for the results header.
	const countParams = params.slice(0, -1);
	const { rows: cnt } = await pool.query<{ n: string }>(
		`SELECT count(*) n FROM services WHERE ${where.join(" AND ")}`,
		countParams,
	);

	return {
		centres: rows.map(toCentre),
		locationLabel,
		total: Number(cnt[0].n),
	};
}

export function distanceKm(
	aLat: number,
	aLng: number,
	bLat: number,
	bLng: number,
): number {
	const R = 6371;
	const dLat = ((bLat - aLat) * Math.PI) / 180;
	const dLng = ((bLng - aLng) * Math.PI) / 180;
	const x =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((aLat * Math.PI) / 180) *
			Math.cos((bLat * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Phase-1 directory landing pages: suburb, care-type×suburb, and state hubs.
// Reuses SELECT / Row / toCentre / titleCase above. Indexable SEO surfaces.
// ---------------------------------------------------------------------------

export type CareTypeSlug =
	| "long-day-care"
	| "preschool"
	| "oshc"
	| "family-day-care";

export const CARE_TYPES: Record<
	CareTypeSlug,
	{ label: string; plural: string; predicate: string }
> = {
	"long-day-care": {
		label: "Long day care",
		plural: "Long day care centres",
		predicate: "is_long_day_care",
	},
	preschool: {
		label: "Preschool",
		plural: "Preschools",
		predicate: "(is_preschool_stand_alone OR is_preschool_part_of_school)",
	},
	oshc: {
		label: "Outside school hours care",
		plural: "OSHC services",
		predicate:
			"(is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care)",
	},
	"family-day-care": {
		label: "Family day care",
		plural: "Family day care services",
		predicate: "service_type = 'Family Day Care'",
	},
};

export function isCareTypeSlug(s: string): s is CareTypeSlug {
	return Object.prototype.hasOwnProperty.call(CARE_TYPES, s);
}

const STATE_NAMES: Record<string, string> = {
	NSW: "New South Wales",
	VIC: "Victoria",
	QLD: "Queensland",
	WA: "Western Australia",
	SA: "South Australia",
	TAS: "Tasmania",
	ACT: "Australian Capital Territory",
	NT: "Northern Territory",
};
export function stateName(code: string): string | null {
	return STATE_NAMES[code.toUpperCase()] ?? null;
}

// NQS best-first ordering for list display + "top centres".
const RATING_RANK_SQL = `array_position(ARRAY['Significant Improvement Required','Working Towards NQS','Meeting NQS','Exceeding NQS','Excellent']::text[], overall_rating) DESC NULLS LAST`;

export type SuburbStats = {
	total: number;
	exceeding: number; // Exceeding NQS + Excellent
	meetingPlus: number;
	notRated: number;
	totalPlaces: number;
	byCare: { ldc: number; preschool: number; oshc: number; fdc: number };
};

function computeStats(centres: DirectoryCentre[]): SuburbStats {
	const s: SuburbStats = {
		total: centres.length,
		exceeding: 0,
		meetingPlus: 0,
		notRated: 0,
		totalPlaces: 0,
		byCare: { ldc: 0, preschool: 0, oshc: 0, fdc: 0 },
	};
	for (const c of centres) {
		const r = c.rating;
		if (r === "Excellent" || r === "Exceeding NQS") s.exceeding++;
		if (r === "Excellent" || r === "Exceeding NQS" || r === "Meeting NQS")
			s.meetingPlus++;
		if (!r) s.notRated++;
		if (c.places) s.totalPlaces += c.places;
		if (c.flags.ldc) s.byCare.ldc++;
		if (c.flags.preschoolStandalone || c.flags.preschoolSchool)
			s.byCare.preschool++;
		if (c.flags.oshcBefore || c.flags.oshcAfter || c.flags.oshcVacation)
			s.byCare.oshc++;
		if (c.flags.familyDayCare) s.byCare.fdc++;
	}
	return s;
}

function centroid(
	centres: DirectoryCentre[],
): { lat: number; lng: number } | null {
	const pts = centres.filter((c) => c.lat != null && c.lng != null);
	if (!pts.length) return null;
	return {
		lat: pts.reduce((a, c) => a + (c.lat as number), 0) / pts.length,
		lng: pts.reduce((a, c) => a + (c.lng as number), 0) / pts.length,
	};
}

export type SuburbPage = {
	suburbName: string;
	state: string | null;
	postcode: string;
	careType: CareTypeSlug | null;
	centres: DirectoryCentre[];
	stats: SuburbStats;
	center: { lat: number; lng: number } | null;
};

// Suburb (and optionally care-type) landing data. Returns null if no centre matches
// (the route then renders notFound, so we never ship empty/doorway pages).
export async function getSuburbPage(opts: {
	suburb: string; // slug
	postcode: string;
	careType?: CareTypeSlug;
}): Promise<SuburbPage | null> {
	const suburb = opts.suburb.replace(/-/g, " ");
	const where = ["upper(suburb) = upper($1)", "postcode = $2"];
	const params: unknown[] = [suburb, opts.postcode];
	if (opts.careType) where.push(CARE_TYPES[opts.careType].predicate);
	const { rows } = await pool.query<Row>(
		`SELECT ${SELECT} FROM services WHERE ${where.join(" AND ")}
     ORDER BY ${RATING_RANK_SQL}, service_name`,
		params,
	);
	if (!rows.length) return null;
	const centres = rows.map(toCentre);
	return {
		suburbName: titleCase(suburb),
		state: rows[0].state,
		postcode: opts.postcode,
		careType: opts.careType ?? null,
		centres,
		stats: computeStats(centres),
		center: centroid(centres),
	};
}

export type SuburbLink = {
	suburb: string;
	slug: string;
	postcode: string;
	state: string | null;
	count: number;
};

// Nearby suburbs (within 15km) for the internal-link graph at the foot of a suburb page.
export async function getNearbySuburbs(
	center: { lat: number; lng: number },
	excludePostcode: string,
	limit = 8,
): Promise<SuburbLink[]> {
	const { rows } = await pool.query<{
		suburb: string;
		state: string;
		postcode: string;
		n: string;
	}>(
		`SELECT suburb, state, postcode, count(*) n,
            min(ST_Distance(geog, ST_MakePoint($1,$2)::geography)) d
     FROM services
     WHERE geog IS NOT NULL AND postcode <> $3
       AND ST_DWithin(geog, ST_MakePoint($1,$2)::geography, 15000)
     GROUP BY suburb, state, postcode
     ORDER BY d ASC
     LIMIT $4`,
		[center.lng, center.lat, excludePostcode, limit],
	);
	return rows.map((r) => ({
		suburb: titleCase(r.suburb),
		slug: suburbSlug(r.suburb),
		postcode: r.postcode,
		state: r.state,
		count: Number(r.n),
	}));
}

export type StateHub = {
	code: string;
	name: string;
	total: number;
	suburbCount: number;
	topSuburbs: SuburbLink[];
	topCentres: DirectoryCentre[];
};

export async function getStateHub(code: string): Promise<StateHub | null> {
	const name = stateName(code);
	if (!name) return null;
	const cu = code.toUpperCase();
	const { rows: stat } = await pool.query<{ total: string; suburbs: string }>(
		`SELECT count(*) total, count(DISTINCT (suburb, postcode)) suburbs
     FROM services WHERE state = $1`,
		[cu],
	);
	if (!Number(stat[0]?.total)) return null;
	const { rows: subs } = await pool.query<{
		suburb: string;
		postcode: string;
		n: string;
	}>(
		`SELECT suburb, postcode, count(*) n FROM services WHERE state = $1
     GROUP BY suburb, postcode ORDER BY n DESC, suburb LIMIT 60`,
		[cu],
	);
	const { rows: top } = await pool.query<Row>(
		`SELECT ${SELECT} FROM services
     WHERE state = $1 AND overall_rating IN ('Exceeding NQS','Excellent')
     ORDER BY ${RATING_RANK_SQL}, number_of_approved_places DESC NULLS LAST
     LIMIT 8`,
		[cu],
	);
	return {
		code: cu,
		name,
		total: Number(stat[0].total),
		suburbCount: Number(stat[0].suburbs),
		topSuburbs: subs.map((r) => ({
			suburb: titleCase(r.suburb),
			slug: suburbSlug(r.suburb),
			postcode: r.postcode,
			state: cu,
			count: Number(r.n),
		})),
		topCentres: top.map(toCentre),
	};
}

// Resolve a typed location (suburb name or 4-digit postcode) to its canonical landing
// page: the biggest suburb+postcode cluster. Powers the homepage search hero.
export async function resolvePlace(
	q: string,
): Promise<{ suburb: string; slug: string; postcode: string; state: string } | null> {
	const t = q.trim();
	if (!t) return null;
	const pick = (r?: { suburb: string; state: string; postcode: string }) =>
		r
			? {
					suburb: titleCase(r.suburb),
					slug: suburbSlug(r.suburb),
					postcode: r.postcode,
					state: r.state,
				}
			: null;

	if (/^\d{4}$/.test(t)) {
		const { rows } = await pool.query<{
			suburb: string;
			state: string;
			postcode: string;
		}>(
			`SELECT suburb, state, postcode, count(*) n FROM services
       WHERE postcode = $1 GROUP BY suburb, state, postcode ORDER BY n DESC LIMIT 1`,
			[t],
		);
		return pick(rows[0]);
	}

	const cleaned = t.replace(/,/g, " ").replace(/\s+/g, " ").trim();
	const m = cleaned.match(/^(.*?)(?:\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA))?$/i);
	const suburb = (m?.[1] ?? cleaned).trim();
	const state = (m?.[2] ?? "").toUpperCase();
	const params: unknown[] = [suburb];
	let sql = `SELECT suburb, state, postcode, count(*) n FROM services WHERE upper(suburb) = upper($1)`;
	if (state) {
		sql += ` AND state = $2`;
		params.push(state);
	}
	sql += ` GROUP BY suburb, state, postcode ORDER BY n DESC LIMIT 1`;
	let { rows } = await pool.query<{
		suburb: string;
		state: string;
		postcode: string;
	}>(sql, params);
	if (!rows[0] && state) {
		({ rows } = await pool.query<{
			suburb: string;
			state: string;
			postcode: string;
		}>(
			`SELECT suburb, state, postcode, count(*) n FROM services WHERE upper(suburb) = upper($1)
       GROUP BY suburb, state, postcode ORDER BY n DESC LIMIT 1`,
			[suburb],
		));
	}
	return pick(rows[0]);
}

// Sitemap inputs: every suburb+postcode with centres, and which care types exist there
// (so we emit only landing pages that have content — no empty/doorway URLs).
export type SitemapSuburb = {
	slug: string;
	postcode: string;
	ldc: boolean;
	preschool: boolean;
	oshc: boolean;
	fdc: boolean;
};
export async function getSitemapSuburbs(): Promise<SitemapSuburb[]> {
	const { rows } = await pool.query<{
		suburb: string;
		postcode: string;
		ldc: boolean;
		preschool: boolean;
		oshc: boolean;
		fdc: boolean;
	}>(
		`SELECT suburb, postcode,
            bool_or(is_long_day_care) ldc,
            bool_or(is_preschool_stand_alone OR is_preschool_part_of_school) preschool,
            bool_or(is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care) oshc,
            bool_or(service_type = 'Family Day Care') fdc
     FROM services WHERE suburb IS NOT NULL AND postcode IS NOT NULL
     GROUP BY suburb, postcode`,
	);
	return rows.map((r) => ({
		slug: suburbSlug(r.suburb),
		postcode: r.postcode,
		ldc: r.ldc,
		preschool: r.preschool,
		oshc: r.oshc,
		fdc: r.fdc,
	}));
}

export async function getStates(): Promise<string[]> {
	const { rows } = await pool.query<{ state: string }>(
		`SELECT DISTINCT state FROM services WHERE state IS NOT NULL ORDER BY state`,
	);
	return rows.map((r) => r.state).filter((s) => stateName(s) !== null);
}
