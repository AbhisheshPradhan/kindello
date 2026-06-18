// Canonical search state for the Finder (the "copilot rail + results canvas" hybrid).
//
// ONE state object is the single source of truth for the whole experience: the AI chat
// proposes deltas to it, the filter chips apply deltas to it, and BOTH render from it.
// This file is pure data + a reducer (NO server / pg imports) so it is safe to import
// into client components. The server query lives in `search-core.ts`.

export type CareType =
	| "long_day_care"
	| "preschool"
	| "oshc"
	| "family_day_care";

export type NqsRating =
	| "Significant Improvement Required"
	| "Working Towards NQS"
	| "Meeting NQS"
	| "Exceeding NQS"
	| "Excellent";

// NQS ratings worst -> best, so a min_rating means "at least this good". A readonly tuple
// (not NqsRating[]) so it can feed z.enum() directly in the model tool schema.
export const RATING_ORDER = [
	"Significant Improvement Required",
	"Working Towards NQS",
	"Meeting NQS",
	"Exceeding NQS",
	"Excellent",
] as const satisfies readonly NqsRating[];

export type CentreSize = "small" | "medium" | "large"; // <40 / 40-79 / 80+ approved places
export type SortKey = "distance" | "rating" | "size";

export type ResolvedLocation = { label: string; lat: number; lng: number };

// Decision factors we can capture from the parent but CANNOT filter on yet (no fees /
// vacancy / room data). Stored so the chat can frame answers honestly and so they seed
// the CRM later — never fabricated into a filter.
export type SoftIntent = {
	childAge?: string; // e.g. "2yo", "school-age"
	daysNeeded?: string; // e.g. "Mon/Wed/Fri", "full-time"
	startDate?: string; // e.g. "Jan 2027"
};

export type SearchState = {
	location: ResolvedLocation | null; // required before any search runs
	careType: CareType | null;
	minRating: NqsRating | null;
	radiusKm: number;
	size: CentreSize | null;
	keyword: string | null; // philosophy / program / name term (rank, not filter)
	sort: SortKey;
	limit: number;
	excludeIds: string[]; // pagination for the AI "show more" path
	intent: SoftIntent;
};

export const DEFAULT_RADIUS_KM = 5;
// The canvas is the "directory" surface, so it shows the full filtered set (capped),
// not the curated 3-5 the AI narrates in the rail.
export const DEFAULT_CANVAS_LIMIT = 24;
export const MAX_CANVAS_LIMIT = 60;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 30;

export function defaultSearchState(): SearchState {
	return {
		location: null,
		careType: null,
		minRating: null,
		radiusKm: DEFAULT_RADIUS_KM,
		size: null,
		keyword: null,
		sort: "distance",
		limit: DEFAULT_CANVAS_LIMIT,
		excludeIds: [],
		intent: {},
	};
}

const clamp = (n: number, lo: number, hi: number) =>
	Math.min(hi, Math.max(lo, n));

// The single mutation point. A chip removal is just a delta setting a field back to its
// neutral value; a slider is a delta with `radiusKm`; the model returns a delta too.
// Changing any *filter* clears pagination (a new filtered set starts fresh).
export function applyDelta(
	state: SearchState,
	delta: Partial<SearchState>,
): SearchState {
	const next: SearchState = { ...state, ...delta, intent: { ...state.intent, ...delta.intent } };
	if (delta.radiusKm != null)
		next.radiusKm = clamp(delta.radiusKm, MIN_RADIUS_KM, MAX_RADIUS_KM);
	if (delta.limit != null)
		next.limit = clamp(delta.limit, 1, MAX_CANVAS_LIMIT);
	// Any change other than pure pagination invalidates the exclude list.
	const onlyPagination =
		Object.keys(delta).length === 1 && "excludeIds" in delta;
	if (!onlyPagination && delta.excludeIds == null) next.excludeIds = [];
	return next;
}

// Human-readable labels for the criteria chips.
export const CARE_TYPE_LABEL: Record<CareType, string> = {
	long_day_care: "Long day care",
	preschool: "Preschool",
	oshc: "OSHC",
	family_day_care: "Family day care",
};

export const SIZE_LABEL: Record<CentreSize, string> = {
	small: "Small (<40)",
	medium: "Medium (40-79)",
	large: "Large (80+)",
};

export const SORT_LABEL: Record<SortKey, string> = {
	distance: "Nearest",
	rating: "Top rated",
	size: "Largest",
};

// Whether the state has enough to run a search (a location anchor).
export function canSearch(state: SearchState): boolean {
	return state.location != null;
}
