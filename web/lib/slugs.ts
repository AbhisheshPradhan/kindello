// Pure URL-slug helpers — NO server deps, so both server modules (lib/directory.ts) and
// client components can import them. Keep this free of `server-only` / pg / etc.

// "Surry Hills" -> "surry-hills".
export function suburbSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Centre detail slug: <name>-<suburb>-<postcode>. The id (not the slug) is the lookup key.
export function centreSlug(
	name: string,
	suburb?: string | null,
	postcode?: string | null,
): string {
	return suburbSlug([name, suburb, postcode].filter(Boolean).join(" "));
}

// Canonical centre detail URL: /centre/<id>/<name-suburb-postcode>.
export function centrePath(c: {
	id: string;
	name: string;
	suburb?: string | null;
	postcode?: string | null;
}): string {
	return `/centre/${c.id}/${centreSlug(c.name, c.suburb, c.postcode)}`;
}
