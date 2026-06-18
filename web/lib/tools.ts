import { tool } from "ai";
import { z } from "zod";
import { queryCentres, resolveLocationText } from "./search-core";
import { RATING_ORDER } from "./search-state";

export const resolveLocation = tool({
	description:
		"Turn an Australian suburb name or 4-digit postcode into a latitude/longitude to anchor a " +
		"search on. Uses the centroid of known centres there, so no geocoding API is needed.",
	inputSchema: z.object({
		location: z
			.string()
			.describe('A suburb or postcode, e.g. "Bondi" or "2026".'),
	}),
	execute: async ({ location }) => resolveLocationText(location),
});

// A structured channel for the model to emit suggested next questions alongside its
// answer. The client reads the questions off the call `input` to render the FollowUps
// chips. It carries a trivial `execute` that just echoes the questions back: without a
// result, a follow-up turn resends a tool call with no matching tool result and OpenAI
// rejects the history (AI_MissingToolResultsError). Echoing satisfies that requirement
// while changing nothing the model needs to reason about.
export const suggestFollowUps = tool({
	description:
		"Offer 2-3 suggested next questions the parent could tap, phrased in their voice (first " +
		"person, e.g. \"Show only the top-rated ones\"). ONLY call this when a refinement genuinely " +
		"helps; omit it entirely otherwise. Each question must refine ONLY along data we actually " +
		"hold: NQS rating, number of approved places, care type (long day care / preschool / OSHC / " +
		"family day care), search radius or a nearby suburb, or a teaching philosophy/program term. " +
		"NEVER suggest fees, vacancies, availability, websites, emails or anything not in the " +
		"register, and never re-ask something already answered this conversation.",
	inputSchema: z.object({
		questions: z
			.array(z.string())
			.min(1)
			.max(3)
			.describe("2-3 short tappable follow-up questions in the parent's voice."),
	}),
	execute: async ({ questions }) => ({ questions }),
});

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
		exclude_ids: z
			.array(z.string())
			.optional()
			.describe(
				"Centre ids (the `id` field from earlier results) to leave out. Pass every id " +
					"already shown this conversation when the parent asks to see MORE / different " +
					"centres, so the next batch never repeats one they've seen.",
			),
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
		exclude_ids = [],
	}) => {
		// Delegates to the shared search-core so the model tool and the deterministic
		// /api/search chip path run the EXACT same SQL — chat and filters never drift.
		const centres = await queryCentres({
			lat: latitude,
			lng: longitude,
			radiusKm: radius_km,
			careType: care_type ?? null,
			minRating: min_rating ?? null,
			keyword: keyword ?? null,
			variants,
			sort: "distance",
			limit,
			excludeIds: exclude_ids,
		});
		if (!centres.length)
			return {
				error: "No centres matched — try a wider radius or fewer filters.",
			};
		return centres;
	},
});
