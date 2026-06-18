import { tool } from "ai";
import { z } from "zod";
import { pool } from "./db";

// Mirrors ingest/search.py. care_type -> SQL predicate over the flag columns.
const CARE_PREDICATES: Record<string, string> = {
	long_day_care: "is_long_day_care",
	preschool: "(is_preschool_stand_alone OR is_preschool_part_of_school)",
	oshc: "(is_oshc_before_school OR is_oshc_after_school OR is_oshc_vacation_care)",
	family_day_care: "service_type = 'Family Day Care'",
};

// NQS ratings worst -> best, so min_rating means "at least this good".
const RATING_ORDER = [
	"Significant Improvement Required",
	"Working Towards NQS",
	"Meeting NQS",
	"Exceeding NQS",
	"Excellent",
] as const;

function mapsLink(parts: (string | null)[]): string {
	const q = parts.filter(Boolean).join(", ");
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export const resolveLocation = tool({
	description:
		"Turn an Australian suburb name or 4-digit postcode into a latitude/longitude to anchor a " +
		"search on. Uses the centroid of known centres there, so no geocoding API is needed.",
	inputSchema: z.object({
		location: z
			.string()
			.describe('A suburb or postcode, e.g. "Bondi" or "2026".'),
	}),
	execute: async ({ location }) => {
		const t = location.trim();
		if (/^\d{4}$/.test(t)) {
			const { rows } = await pool.query(
				`SELECT avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*)::int n
         FROM services WHERE postcode = $1 AND latitude IS NOT NULL`,
				[t],
			);
			const r = rows[0];
			return r?.n
				? {
						lat: r.lat,
						lng: r.lng,
						label: `postcode ${t}`,
						kind: "postcode",
						n: r.n,
					}
				: { error: "No centres found there to anchor a search on." };
		}
		// Normalise punctuation so "Glebe, NSW" / "Glebe NSW" / "Glebe" all parse cleanly.
		const cleaned = t.replace(/,/g, " ").replace(/\s+/g, " ").trim();
		const m = cleaned.match(
			/^(.*?)(?:\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA))?$/i,
		);
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
			// Group by state and take the biggest cluster, so a name shared across states
			// (e.g. Carlton VIC/NSW) resolves to one real place — NOT the meaningless
			// midpoint of all of them (which lands in rural nowhere and matches nothing).
			sql += ` GROUP BY state ORDER BY n DESC LIMIT 1`;
			const { rows } = await pool.query(sql, params);
			return rows[0];
		};

		// Prefer suburb+state; fall back to suburb-only if the state guess misses.
		let r = await lookup(true);
		if (!r?.n && state) r = await lookup(false);
		return r?.n
			? {
					lat: r.lat,
					lng: r.lng,
					label: `${suburb}, ${r.state}`,
					kind: "suburb",
					n: r.n,
				}
			: { error: "No centres found there to anchor a search on." };
	},
});

const MATCH_LABEL = ["no-match", "name-variant", "name-exact"] as const;

export const searchCentres = tool({
	description:
		"Find childcare centres near a coordinate, nearest first, with optional filters.",
	inputSchema: z.object({
		latitude: z.number(),
		longitude: z.number(),
		radius_km: z
			.number()
			.optional()
			.describe("Search radius in km (default 5)."),
		care_type: z
			.enum(["long_day_care", "preschool", "oshc", "family_day_care"])
			.optional(),
		min_rating: z
			.enum(RATING_ORDER)
			.optional()
			.describe("Only centres rated at least this good."),
		keyword: z
			.string()
			.optional()
			.describe(
				"A teaching philosophy / program / name term to prioritise, matched against the centre " +
					'name — e.g. "Montessori", "Reggio", "Steiner", "bush kinder". Results are RANKED ' +
					"(exact name matches first), NOT filtered — so a sparse philosophy still falls back to " +
					"nearby centres rather than returning nothing. Check each result's `match` field.",
			),
		variants: z
			.array(z.string())
			.optional()
			.describe(
				"Lower-priority naming variants of `keyword`, also matched against the name — e.g. for " +
					'"preschool": ["kindergarten","kinder"]. Naming/spelling variants only; do NOT pass ' +
					'conceptual synonyms (e.g. "child-led" for Montessori) — those never appear in names.',
			),
		limit: z.number().optional().describe("Max results (default 10)."),
	}),
	execute: async ({
		latitude,
		longitude,
		radius_km = 5,
		care_type,
		min_rating,
		keyword,
		variants = [],
		limit = 10,
	}) => {
		const where = [
			"geog IS NOT NULL",
			"ST_DWithin(geog, ST_MakePoint($1,$2)::geography, $3)",
		];
		const params: unknown[] = [longitude, latitude, radius_km * 1000];
		if (care_type) where.push(CARE_PREDICATES[care_type]);
		if (min_rating) {
			const allowed = RATING_ORDER.slice(
				RATING_ORDER.indexOf(min_rating),
			);
			params.push(allowed);
			where.push(`overall_rating = ANY($${params.length})`);
		}

		// Keyword scoring: exact name match (2) > variant match (1) > none (0). We RANK by this,
		// not filter — so a sparse philosophy (e.g. the ~10 Reggio centres nationally) still falls
		// back to nearby alternatives instead of an empty screen. The system prompt tells the model
		// to frame that fallback honestly and never claim an unmatched centre's philosophy.
		let scoreExpr = "0";
		if (keyword) {
			params.push(`%${keyword}%`);
			const kwIdx = params.length;
			const variantPatterns = variants
				.filter(Boolean)
				.map((v) => `%${v}%`);
			if (variantPatterns.length) {
				params.push(variantPatterns);
				scoreExpr = `CASE WHEN service_name ILIKE $${kwIdx} THEN 2 WHEN service_name ILIKE ANY($${params.length}) THEN 1 ELSE 0 END`;
			} else {
				scoreExpr = `CASE WHEN service_name ILIKE $${kwIdx} THEN 2 ELSE 0 END`;
			}
		}

		params.push(limit);
		const limIdx = params.length;
		const orderBy = keyword
			? `match_score DESC, geog <-> ST_MakePoint($1,$2)::geography`
			: `geog <-> ST_MakePoint($1,$2)::geography`;
		const { rows } = await pool.query(
			`SELECT service_name, service_address, suburb, state, postcode, overall_rating,
              nullif(phone, '') AS phone, operating_hours,
              latitude::float8 AS latitude, longitude::float8 AS longitude,
              service_approval_number AS id,
              number_of_approved_places AS places,
              ${scoreExpr} AS match_score,
              round((ST_Distance(geog, ST_MakePoint($1,$2)::geography)/1000)::numeric, 2)::float8 AS distance_km
       FROM services
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderBy}
       LIMIT $${limIdx}`,
			params,
		);
		if (!rows.length)
			return {
				error: "No centres matched — try a wider radius or fewer filters.",
			};
		return rows.map((r) => {
			const { match_score, ...rest } = r;
			return {
				...rest,
				...(keyword ? { match: MATCH_LABEL[match_score] } : {}),
				maps_link: mapsLink([
					r.service_name,
					r.service_address,
					r.suburb,
					r.state,
					r.postcode,
				]),
			};
		});
	},
});
