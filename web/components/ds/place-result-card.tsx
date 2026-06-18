"use client";

import type { CSSProperties } from "react";
import { Icon } from "./icon";

const GRADS = [
	"linear-gradient(135deg,#2fb3b3,#136d6d)",
	"linear-gradient(135deg,#57c5c5,#158888)",
	"linear-gradient(135deg,#ffc83d,#ff8166)",
	"linear-gradient(135deg,#ffd766,#f5b125)",
	"linear-gradient(135deg,#2fb3b3,#57c5c5)",
	"linear-gradient(135deg,#ff8166,#f9603f)",
];

/**
 * PlaceResultCard — the larger result card used in the Places-tab grid beside
 * the map: photo + Verified badge, name, rating, accent "places now" line,
 * address and phone, and a "More info" affordance.
 */
export function PlaceResultCard({
	name = "Little Gum Tree Early Learning",
	suburb = "Surry Hills",
	distance = "1.2 km",
	rating = 4.8,
	reviews = 126,
	placesNow = "3 places now",
	phone = null,
	verified = true,
	seed = 0,
	href,
	onMore,
	style,
}: {
	name?: string;
	suburb?: string;
	distance?: string;
	rating?: number;
	reviews?: number;
	placesNow?: string | null;
	phone?: string | null;
	verified?: boolean;
	seed?: number;
	href?: string;
	onMore?: () => void;
	style?: CSSProperties;
}) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				background: "var(--surface)",
				border: "1px solid var(--border)",
				borderRadius: "var(--radius-lg)",
				overflow: "hidden",
				boxShadow: "var(--shadow-xs)",
				...style,
			}}
		>
			<div
				style={{
					height: 120,
					position: "relative",
					background: GRADS[seed % GRADS.length],
				}}
			>
				{verified && (
					<span
						style={{
							position: "absolute",
							top: 9,
							left: 9,
							display: "inline-flex",
							alignItems: "center",
							gap: 4,
							padding: "3px 9px",
							fontSize: 11,
							fontWeight: 600,
							color: "var(--teal-700)",
							background: "rgba(255,255,255,.94)",
							borderRadius: "var(--radius-pill)",
						}}
					>
						<Icon
							name="shield-check"
							size={11}
						/>{" "}
						Verified
					</span>
				)}
			</div>
			<div
				style={{
					padding: "13px 15px 15px",
					display: "flex",
					flexDirection: "column",
					gap: 9,
					flex: 1,
				}}
			>
				<div
					style={{
						fontSize: 15.5,
						fontWeight: 600,
						color: "var(--fg)",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{name}
				</div>
				<div
					style={{
						fontSize: 13.5,
						color: "var(--text-body)",
						display: "flex",
						alignItems: "center",
						gap: 6,
					}}
				>
					<span style={{ color: "var(--sun-400)" }}>★</span>
					<strong
						style={{
							color: "var(--fg)",
							fontWeight: 600,
							fontFamily: "var(--font-mono)",
						}}
					>
						{rating.toFixed(1)}
					</strong>
					<span style={{ color: "var(--muted-fg)" }}>
						({reviews})
					</span>
					{placesNow && (
						<>
							<span style={{ color: "var(--border)" }}>·</span>
							<span
								style={{
									color: "var(--teal-600)",
									fontWeight: 600,
								}}
							>
								{placesNow}
							</span>
						</>
					)}
				</div>
				<div
					style={{
						fontSize: 13,
						color: "var(--muted-fg)",
						display: "inline-flex",
						alignItems: "center",
						gap: 7,
					}}
				>
					<Icon
						name="map-pin"
						size={14}
					/>{" "}
					{suburb}
					{distance ? ` · ${distance}` : ""}
				</div>
				{phone && (
					<div
						style={{
							fontSize: 13,
							color: "var(--muted-fg)",
							display: "inline-flex",
							alignItems: "center",
							gap: 7,
						}}
					>
						<Icon
							name="phone"
							size={14}
						/>{" "}
						{phone}
					</div>
				)}
				{href ? (
					<a
						href={href}
						style={{
							marginTop: "auto",
							border: "1px solid var(--border)",
							borderRadius: "var(--radius-md)",
							textAlign: "center",
							padding: 9,
							fontFamily: "var(--font-sans)",
							fontSize: 13.5,
							fontWeight: 600,
							color: "var(--text-body)",
							background: "var(--surface)",
							textDecoration: "none",
						}}
					>
						More info
					</a>
				) : (
					<button
						onClick={onMore}
						style={{
							marginTop: "auto",
							border: "1px solid var(--border)",
							borderRadius: "var(--radius-md)",
							textAlign: "center",
							padding: 9,
							fontFamily: "var(--font-sans)",
							fontSize: 13.5,
							fontWeight: 600,
							color: "var(--text-body)",
							background: "var(--surface)",
							cursor: "pointer",
						}}
					>
						More info
					</button>
				)}
			</div>
		</div>
	);
}
