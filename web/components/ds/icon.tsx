import type { CSSProperties, SVGProps } from "react";

// Inline Lucide paths (the app's icon set) so DS components stay dependency-free
// and render identically on the server. Stroke-based, inherits currentColor.
const PATHS: Record<string, React.ReactNode> = {
	star: (
		<path d="M11.5 2.8 14 8l5.7.8-4.1 4 1 5.7-5.1-2.7L6.3 18.5l1-5.7-4.1-4L8.9 8z" />
	),
	"map-pin": (
		<>
			<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z" />
			<circle
				cx="12"
				cy="10"
				r="3"
			/>
		</>
	),
	clock: (
		<>
			<circle
				cx="12"
				cy="12"
				r="9"
			/>
			<path d="M12 7v5l3 2" />
		</>
	),
	users: (
		<>
			<path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle
				cx="9"
				cy="7"
				r="4"
			/>
			<path d="M22 19v-2a4 4 0 0 0-3-3.9" />
			<path d="M16 3.1a4 4 0 0 1 0 7.8" />
		</>
	),
	phone: (
		<path d="M14.5 3.5a16 16 0 0 0 6 6l-2 2a2 2 0 0 1-2 .5 13 13 0 0 1-5-3 13 13 0 0 1-3-5 2 2 0 0 1 .5-2l2-2" />
	),
	heart: (
		<path d="M19 5.5a4.5 4.5 0 0 0-7 1 4.5 4.5 0 0 0-7-1c-2 2-1.5 5 1 7.5l6 6 6-6c2.5-2.5 3-5.5 1-7.5Z" />
	),
	"shield-check": (
		<>
			<path d="M12 3 5 6v5c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6Z" />
			<path d="m9 12 2 2 4-4" />
		</>
	),
	sparkles: (
		<path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3z" />
	),
	search: (
		<>
			<circle
				cx="11"
				cy="11"
				r="7"
			/>
			<path d="m20 20-3.5-3.5" />
		</>
	),
	"arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
	"arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
	"chevron-right": <path d="m9 6 6 6-6 6" />,
	"chevron-down": <path d="m6 9 6 6 6-6" />,
	"chevron-left": <path d="m15 6-6 6 6 6" />,
	check: <path d="m5 12 4.5 4.5L19 7" />,
	baby: (
		<>
			<path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
			<path d="M19 6.3a9 9 0 0 1-8 5.7A9 9 0 0 1 3 6.3" />
			<path d="M3 12a9 9 0 0 0 18 0" />
		</>
	),
	"graduation-cap": (
		<>
			<path d="M22 9 12 5 2 9l10 4 10-4Z" />
			<path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4" />
		</>
	),
	blocks: (
		<>
			<rect
				x="3"
				y="3"
				width="8"
				height="8"
				rx="1"
			/>
			<rect
				x="13"
				y="13"
				width="8"
				height="8"
				rx="1"
			/>
			<path d="M11 7h4a2 2 0 0 1 2 2v4" />
		</>
	),
	sun: (
		<>
			<circle
				cx="12"
				cy="12"
				r="4"
			/>
			<path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
		</>
	),
	utensils: (
		<>
			<path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 2v20M21 15V2a5 5 0 0 0-3 5v6c0 1.1.9 2 2 2h1Zm0 0v7" />
		</>
	),
	leaf: (
		<>
			<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
			<path d="M2 21c0-3 1.85-5.36 5.08-6" />
		</>
	),
	accessibility: (
		<>
			<circle
				cx="16"
				cy="4"
				r="1"
			/>
			<path d="m18 19 1-7-6 1M5 8l3-3 5.5 3-2.36 3.5M4.24 14.5a5 5 0 0 0 6.88 6M13.76 17.5a5 5 0 0 0-3.12-7" />
		</>
	),
	"dollar-sign": (
		<>
			<line
				x1="12"
				y1="2"
				x2="12"
				y2="22"
			/>
			<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
		</>
	),
	calendar: (
		<>
			<rect
				x="3"
				y="4"
				width="18"
				height="18"
				rx="2"
			/>
			<path d="M16 2v4M8 2v4M3 10h18" />
		</>
	),
	bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
};

export type IconName = keyof typeof PATHS | string;

export function Icon({
	name,
	size = 20,
	strokeWidth = 2,
	style,
	...props
}: {
	name: IconName;
	size?: number;
	strokeWidth?: number;
	style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "name" | "style">) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			style={style}
			aria-hidden="true"
			{...props}
		>
			{PATHS[name] ?? null}
		</svg>
	);
}
