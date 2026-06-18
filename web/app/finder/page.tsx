import type { Metadata } from "next";
import { FinderApp } from "@/components/finder/finder-app";

export const metadata: Metadata = {
	title: "Find childcare — Kindello",
	description:
		"Search every approved childcare and early-education service in Australia. Filter by care type, NQS rating, distance and size, or just ask.",
};

// The hybrid Finder: an old-school filter directory (location + filter chips + map + cards)
// and a modern AI assistant, sharing ONE search state. Filter-first or chat-first; both
// drive the same canvas.
export default function FinderPage() {
	return <FinderApp />;
}
