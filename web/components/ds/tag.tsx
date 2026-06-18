import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "teal" | "coral" | "sun";

const TONES: Record<Tone, string> = {
	neutral: "bg-secondary text-body",
	teal: "bg-teal-50 text-teal-700",
	coral: "bg-coral-100 text-coral-600",
	sun: "bg-sun-100 text-sun-500",
};

/** Tag — a small rounded pill for centre attributes ("Montessori", "Ages 0–5"). */
export function Tag({
	tone = "neutral",
	className,
	children,
	...props
}: { tone?: Tone; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.25 px-2.75 py-1 font-sans text-[13px] font-medium leading-[1.4] rounded-full whitespace-nowrap",
				TONES[tone],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
