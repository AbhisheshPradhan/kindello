// Server-side search core — the SINGLE place the centre-finding SQL lives. Both the
// model tool (`lib/tools.ts`, AI path) and the deterministic `/api/search` route (chip
// path) call these, so chat and filters can never drift apart. Imports `pg`, so this is
// server-only; the pure state/reducer lives in `search-state.ts`.

import { pool } from "./db";
import {
	RATING_ORDER,
	type CareType,
	type CentreSize,
	type NqsRating,
	type SortKey,
	type SearchState,
} from "./search-state";
import type { Centre } from "@/components/centre-card";

// care_type -> SQL predicate over the ACECQA flag columns (mirrors ingest/search.py).
const CARE_PREDICATES: Record<CareType, string> = {
	long_day_care: "is_long_day_care",
	preschool: "(is_preschool_stand_alone OR is_preschool_part_of_school)",
	oshc: "(is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care)",
	family_day_care: "service_type = 'Family Day Care'",
};

// approved-places buckets -> SQL predicate.
const SIZE_PREDICATES: Record<CentreSize, string> = {
	small: "number_of_approved_places < 40",
	medium: "number_of_approved_places BETWEEN 40 AND 79",
	large: "number_of_approved_places >= 80",
};

const MATCH_LABEL = ["no-match", "name-variant", "name-exact"] as const;

function mapsLink(parts: (string | null)[]): string {
	const q = parts.filter(Boolean).join(", ");
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function serviceTypeLabel(r: {
	raw_service_type: string | null;
	is_long_day_care: boolean | null;
	is_preschool_stand_alone: boolean | null;
	is_preschool_part_of_school: boolean | null;
	is_oshc_before_school: boolean | null;
	is_oshc_after_school: boolean | null;
	is_oshc_vacation_care: boolean | null;
}): string | null {
	if (r.raw_service_type === "Family Day Care") return "Family Day Care";
	const t: string[] = [];
	if (r.is_long_day_care) t.push("Long Day Care");
	if (r.is_preschool_stand_alone || r.is_preschool_part_of_school)
		t.push("Preschool");
	if (r.is_oshc_before_school || r.is_oshc_after_school || r.is_oshc_vacation_care)
		t.push("OSHC");
	return t.length ? t.join(" · ") : r.raw_service_type;
}

// ---- location resolver (suburb / postcode -> centroid of our own geocoded rows) ----
export type ResolveResult =
	| { lat: number; lng: number; label: string; kind: string; n: number }
	| { error: string };

export async function resolveLocationText(location: string): Promise<ResolveResult> {
	const t = location.trim();
	if (/^\d{4}$/.test(t)) {
		const { rows } = await pool.query<{ lat: number; lng: number; n: number }>(
			`SELECT avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*)::int n
       FROM services WHERE postcode = $1 AND latitude IS NOT NULL`,
			[t],
		);
		const r = rows[0];
		return r?.n
			? { lat: r.lat, lng: r.lng, label: `postcode ${t}`, kind: "postcode", n: r.n }
			: { error: "No centres found there to anchor a search on." };
	}
	const cleaned = t.replace(/,/g, " ").replace(/\s+/g, " ").trim();
	const m = cleaned.match(/^(.*?)(?:\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA))?$/i);
	const suburb = (m?.[1] ?? cleaned).trim();
	const state = (m?.[2] ?? "").toUpperCase();

	const lookup = async (withState: boolean) => {
		const params: unknown[] = [suburb];
		let sql = `SELECT state, avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*)::int n
               FROM services WHERE upper(suburb) = upper($1) AND latitude IS NOT NULL`;
		if (withState && state) {
			sql += ` AND state = $2`;
			params.push(state);
		}
		// Biggest cluster, so a name shared across states (Carlton VIC/NSW) resolves to one
		// real place, not the meaningless midpoint of all of them.
		sql += ` GROUP BY state ORDER BY n DESC LIMIT 1`;
		const { rows } = await pool.query<{
			state: string;
			lat: number;
			lng: number;
			n: number;
		}>(sql, params);
		return rows[0];
	};

	let r = await lookup(true);
	if (!r?.n && state) r = await lookup(false);
	return r?.n
		? { lat: r.lat, lng: r.lng, label: `${suburb}, ${r.state}`, kind: "suburb", n: r.n }
		: { error: "No centres found there to anchor a search on." };
}

// ---- centre query ----
export type QueryParams = {
	lat: number;
	lng: number;
	radiusKm: number;
	careType?: CareType | null;
	minRating?: NqsRating | null;
	size?: CentreSize | null;
	keyword?: string | null;
	variants?: string[];
	sort?: SortKey;
	limit: number;
	excludeIds?: string[];
};

function buildWhere(p: QueryParams, params: unknown[]): string {
	// params already holds [lng, lat, radius_m]; push extras and reference by index.
	const where = [
		"geog IS NOT NULL",
		"ST_DWithin(geog, ST_MakePoint($1,$2)::geography, $3)",
	];
	if (p.careType) where.push(CARE_PREDICATES[p.careType]);
	if (p.size) where.push(SIZE_PREDICATES[p.size]);
	if (p.minRating) {
		const allowed = RATING_ORDER.slice(RATING_ORDER.indexOf(p.minRating));
		params.push(allowed);
		where.push(`overall_rating = ANY($${params.length})`);
	}
	if (p.excludeIds?.length) {
		params.push(p.excludeIds);
		where.push(`service_approval_number <> ALL($${params.length})`);
	}
	return where.join(" AND ");
}

export async function queryCentres(p: QueryParams): Promise<Centre[]> {
	const params: unknown[] = [p.lng, p.lat, p.radiusKm * 1000];
	const whereSql = buildWhere(p, params);

	// Keyword scoring: exact name (2) > variant (1) > none (0). Ranks, never filters, so a
	// sparse philosophy still falls back to nearby alternatives.
	let scoreExpr = "0";
	if (p.keyword) {
		params.push(`%${p.keyword}%`);
		const kwIdx = params.length;
		const variantPatterns = (p.variants ?? []).filter(Boolean).map((v) => `%${v}%`);
		if (variantPatterns.length) {
			params.push(variantPatterns);
			scoreExpr = `CASE WHEN service_name ILIKE $${kwIdx} THEN 2 WHEN service_name ILIKE ANY($${params.length}) THEN 1 ELSE 0 END`;
		} else {
			scoreExpr = `CASE WHEN service_name ILIKE $${kwIdx} THEN 2 ELSE 0 END`;
		}
	}

	const dist = `geog <-> ST_MakePoint($1,$2)::geography`;
	// `service_approval_number` is the final tiebreaker so equal-rank centres keep a stable
	// order across calls (pagination can't reshuffle ties).
	const sortExpr =
		p.sort === "rating"
			? `array_position($${params.push(RATING_ORDER)}::text[], overall_rating) DESC NULLS LAST, ${dist}, service_approval_number`
			: p.sort === "size"
				? `number_of_approved_places DESC NULLS LAST, ${dist}, service_approval_number`
				: `${dist}, service_approval_number`;
	const orderBy = p.keyword ? `match_score DESC, ${sortExpr}` : sortExpr;

	params.push(p.limit);
	const limIdx = params.length;

	const { rows } = await pool.query(
		`SELECT service_name, service_address, suburb, state, postcode, overall_rating,
            nullif(phone, '') AS phone, operating_hours,
            latitude::float8 AS latitude, longitude::float8 AS longitude,
            service_approval_number AS id,
            number_of_approved_places AS places,
            service_type AS raw_service_type,
            is_long_day_care, is_preschool_stand_alone,
            is_preschool_part_of_school, is_oshc_before_school,
            is_oshc_after_school, is_oshc_vacation_care,
            ${scoreExpr} AS match_score,
            round((ST_Distance(geog, ST_MakePoint($1,$2)::geography)/1000)::numeric, 2)::float8 AS distance_km
     FROM services
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT $${limIdx}`,
		params,
	);

	return rows.map((r) => {
		const {
			match_score,
			raw_service_type,
			is_long_day_care,
			is_preschool_stand_alone,
			is_preschool_part_of_school,
			is_oshc_before_school,
			is_oshc_after_school,
			is_oshc_vacation_care,
			...rest
		} = r;
		return {
			...rest,
			service_type: serviceTypeLabel({
				raw_service_type,
				is_long_day_care,
				is_preschool_stand_alone,
				is_preschool_part_of_school,
				is_oshc_before_school,
				is_oshc_after_school,
				is_oshc_vacation_care,
			}),
			...(p.keyword ? { match: MATCH_LABEL[match_score as 0 | 1 | 2] } : {}),
			maps_link: mapsLink([
				r.service_name,
				r.service_address,
				r.suburb,
				r.state,
				r.postcode,
			]),
		} as Centre;
	});
}

// Facet counts within the current location/radius (+ care type) — so the UI can show
// "12 nearby · 3 Exceeding" and let the parent narrow on an INFORMED basis. Deliberately
// ignores the rating/size/keyword levers so it reports how those would cut the set.
export type Facets = {
	total: number;
	exceeding: number;
	meetingPlus: number;
	care: Record<CareType, number>;
};

export async function computeFacets(p: QueryParams): Promise<Facets> {
	const params: unknown[] = [p.lng, p.lat, p.radiusKm * 1000];
	const where = [
		"geog IS NOT NULL",
		"ST_DWithin(geog, ST_MakePoint($1,$2)::geography, $3)",
	];
	if (p.careType) where.push(CARE_PREDICATES[p.careType]);

	const { rows } = await pool.query<{
		total: string;
		exceeding: string;
		meeting_plus: string;
		ldc: string;
		preschool: string;
		oshc: string;
		fdc: string;
	}>(
		`SELECT count(*) total,
            count(*) FILTER (WHERE overall_rating IN ('Exceeding NQS','Excellent')) exceeding,
            count(*) FILTER (WHERE overall_rating IN ('Meeting NQS','Exceeding NQS','Excellent')) meeting_plus,
            count(*) FILTER (WHERE is_long_day_care) ldc,
            count(*) FILTER (WHERE is_preschool_stand_alone OR is_preschool_part_of_school) preschool,
            count(*) FILTER (WHERE is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care) oshc,
            count(*) FILTER (WHERE service_type = 'Family Day Care') fdc
     FROM services WHERE ${where.join(" AND ")}`,
		params,
	);
	const r = rows[0];
	const n = (s: string | undefined) => Number(s ?? 0);
	return {
		total: n(r?.total),
		exceeding: n(r?.exceeding),
		meetingPlus: n(r?.meeting_plus),
		care: {
			long_day_care: n(r?.ldc),
			preschool: n(r?.preschool),
			oshc: n(r?.oshc),
			family_day_care: n(r?.fdc),
		},
	};
}

// The deterministic entry the chip path uses: state -> rows + facets in one shot.
export type SearchResult = {
	centres: Centre[];
	facets: Facets;
	center: { lat: number; lng: number };
	label: string;
};

export async function runSearch(state: SearchState): Promise<SearchResult | { error: string }> {
	if (!state.location) return { error: "Pick a location first." };
	const params: QueryParams = {
		lat: state.location.lat,
		lng: state.location.lng,
		radiusKm: state.radiusKm,
		careType: state.careType,
		minRating: state.minRating,
		size: state.size,
		keyword: state.keyword,
		sort: state.sort,
		limit: state.limit,
		excludeIds: state.excludeIds,
	};
	const [centres, facets] = await Promise.all([
		queryCentres(params),
		computeFacets(params),
	]);
	return {
		centres,
		facets,
		center: { lat: state.location.lat, lng: state.location.lng },
		label: state.location.label,
	};
}
