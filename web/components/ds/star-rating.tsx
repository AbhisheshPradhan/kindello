import type { CSSProperties } from "react";
import { Icon } from "./icon";

/** StarRating — sunny-yellow filled stars + numeric score and optional review count. */
export function StarRating({
	value = 0,
	count = null,
	size = 16,
	showValue = true,
	style,
}: {
	value?: number;
	count?: number | null;
	size?: number;
	showValue?: boolean;
	style?: CSSProperties;
}) {
	const stars = [];
	for (let i = 1; i <= 5; i++) {
		const fill = Math.max(0, Math.min(1, value - (i - 1)));
		stars.push(
			<span
				key={i}
				className="relative inline-block leading-0"
				style={{ width: size, height: size }}
			>
				<span className="text-border absolute inset-0">
					<Icon
						name="star"
						size={size}
						strokeWidth={1.5}
					/>
				</span>
				<span
					className="text-sun-400 absolute inset-0 overflow-hidden"
					style={{ width: `${fill * 100}%` }}
				>
					<svg
						viewBox="0 0 24 24"
						width={size}
						height={size}
						fill="var(--sun-400)"
						stroke="var(--sun-400)"
						strokeWidth="1.5"
						strokeLinejoin="round"
					>
						<path d="M11.5 2.8 14 8l5.7.8-4.1 4 1 5.7-5.1-2.7L6.3 18.5l1-5.7-4.1-4L8.9 8z" />
					</svg>
				</span>
			</span>,
		);
	}
	return (
		<span
			className="inline-flex items-center gap-1.75 font-sans"
			style={style}
		>
			<span className="inline-flex gap-0.5">{stars}</span>
			{showValue && (
				<span
					className="text-body"
					style={{ fontSize: size - 2 }}
				>
					<strong className="font-semibold text-foreground font-mono">
						{value.toFixed(1)}
					</strong>
					{count != null && (
						<span className="text-muted-foreground">
							{" "}
							· {count} reviews
						</span>
					)}
				</span>
			)}
		</span>
	);
}
