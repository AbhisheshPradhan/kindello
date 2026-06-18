import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Pretty-print an AU phone number for display: landlines as "(02) 9858 5333",
// mobiles and 1800/1300 numbers grouped 4-3-3 ("0413 078 305", "1800 413 885").
// Falls back to the raw string for anything that isn't a recognised 10-digit form.
export function formatAuPhone(raw: string | null | undefined): string {
	if (!raw) return "";
	const d = raw.replace(/\D/g, "");
	if (d.length === 10) {
		if (d.startsWith("04") || d.startsWith("1800") || d.startsWith("1300"))
			return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
		if (d.startsWith("0"))
			return `(${d.slice(0, 2)}) ${d.slice(2, 6)} ${d.slice(6)}`;
	}
	return raw.trim();
}
