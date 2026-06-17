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
    location: z.string().describe('A suburb or postcode, e.g. "Bondi" or "2026".'),
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
        ? { lat: r.lat, lng: r.lng, label: `postcode ${t}`, kind: "postcode", n: r.n }
        : { error: "No centres found there to anchor a search on." };
    }
    const m = t.match(/^(.*?)(?:\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA))?$/i);
    const suburb = (m?.[1] ?? t).trim();
    const state = (m?.[2] ?? "").toUpperCase();
    const params: unknown[] = [suburb];
    let sql = `SELECT avg(latitude)::float8 lat, avg(longitude)::float8 lng, count(*)::int n
               FROM services WHERE upper(suburb) = upper($1) AND latitude IS NOT NULL`;
    if (state) {
      sql += ` AND state = $2`;
      params.push(state);
    }
    const { rows } = await pool.query(sql, params);
    const r = rows[0];
    return r?.n
      ? { lat: r.lat, lng: r.lng, label: suburb + (state ? `, ${state}` : ""), kind: "suburb", n: r.n }
      : { error: "No centres found there to anchor a search on." };
  },
});

export const searchCentres = tool({
  description: "Find childcare centres near a coordinate, nearest first, with optional filters.",
  inputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius_km: z.number().optional().describe("Search radius in km (default 5)."),
    care_type: z.enum(["long_day_care", "preschool", "oshc", "family_day_care"]).optional(),
    min_rating: z.enum(RATING_ORDER).optional().describe("Only centres rated at least this good."),
    limit: z.number().optional().describe("Max results (default 10)."),
  }),
  execute: async ({ latitude, longitude, radius_km = 5, care_type, min_rating, limit = 10 }) => {
    const where = ["geog IS NOT NULL", "ST_DWithin(geog, ST_MakePoint($1,$2)::geography, $3)"];
    const params: unknown[] = [longitude, latitude, radius_km * 1000];
    if (care_type) where.push(CARE_PREDICATES[care_type]);
    if (min_rating) {
      const allowed = RATING_ORDER.slice(RATING_ORDER.indexOf(min_rating));
      params.push(allowed);
      where.push(`overall_rating = ANY($${params.length})`);
    }
    params.push(limit);
    const limIdx = params.length;
    const { rows } = await pool.query(
      `SELECT service_name, service_address, suburb, state, postcode, overall_rating,
              nullif(phone, '') AS phone, operating_hours,
              number_of_approved_places AS places,
              round((ST_Distance(geog, ST_MakePoint($1,$2)::geography)/1000)::numeric, 2)::float8 AS distance_km
       FROM services
       WHERE ${where.join(" AND ")}
       ORDER BY geog <-> ST_MakePoint($1,$2)::geography
       LIMIT $${limIdx}`,
      params,
    );
    if (!rows.length) return { error: "No centres matched — try a wider radius or fewer filters." };
    return rows.map((r) => ({
      ...r,
      maps_link: mapsLink([r.service_name, r.service_address, r.suburb, r.state, r.postcode]),
    }));
  },
});
