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
				style={{
					position: "relative",
					display: "inline-block",
					width: size,
					height: size,
					lineHeight: 0,
				}}
			>
				<span
					style={{
						color: "var(--border)",
						position: "absolute",
						inset: 0,
					}}
				>
					<Icon
						name="star"
						size={size}
						strokeWidth={1.5}
					/>
				</span>
				<span
					style={{
						color: "var(--sun-400)",
						position: "absolute",
						inset: 0,
						width: `${fill * 100}%`,
						overflow: "hidden",
					}}
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
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 7,
				fontFamily: "var(--font-sans)",
				...style,
			}}
		>
			<span style={{ display: "inline-flex", gap: 2 }}>{stars}</span>
			{showValue && (
				<span style={{ fontSize: size - 2, color: "var(--text-body)" }}>
					<strong
						style={{
							fontWeight: 600,
							color: "var(--fg)",
							fontFamily: "var(--font-mono)",
						}}
					>
						{value.toFixed(1)}
					</strong>
					{count != null && (
						<span style={{ color: "var(--muted-fg)" }}>
							{" "}
							· {count} reviews
						</span>
					)}
				</span>
			)}
		</span>
	);
}
