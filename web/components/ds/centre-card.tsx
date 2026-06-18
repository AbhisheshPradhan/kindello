"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { Tag } from "./tag";
import { RatingBadge } from "./rating-badge";
import { StarRating } from "./star-rating";

const PHOTO_GRADS = [
	"linear-gradient(135deg, #2fb3b3, #1ca6a6 60%, #136d6d)",
	"linear-gradient(135deg, #ffc83d, #ff8166 70%, #f9603f)",
	"linear-gradient(135deg, #57c5c5, #2fb3b3 60%, #158888)",
	"linear-gradient(135deg, #ffd766, #ffc83d 60%, #f5b125)",
];

// Warm gradient stand-in for a centre photo (no real imagery yet — Tier-2 enrichment).
function PhotoPlaceholder({
	seed = 0,
	featured = false,
}: {
	seed?: number;
	featured?: boolean;
}) {
	return (
		<div
			className={cn(
				"relative w-full flex items-center justify-center overflow-hidden",
				featured ? "h-full min-h-70" : "h-42 min-h-42",
			)}
			style={{ background: PHOTO_GRADS[seed % PHOTO_GRADS.length] }}
		>
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(circle at 70% 20%, rgba(255,255,255,.25), transparent 55%)",
				}}
			/>
			<span className="text-white/55">
				<Icon
					name="baby"
					size={featured ? 64 : 44}
					strokeWidth={1.5}
				/>
			</span>
		</div>
	);
}

export type CentreCardProps = {
	name?: string;
	suburb?: string;
	distance?: string;
	rating?: number;
	reviews?: number;
	nqs?: string | null;
	tags?: string[];
	keyInfo?: string;
	verified?: boolean;
	seed?: number;
	featured?: boolean;
	href?: string;
	style?: CSSProperties;
};

/**
 * CentreCard — the core listing card. `featured` renders the enlarged
 * horizontal layout (photo left, detail right); default is the compact
 * grid card (photo on top). Pass `href` to make the whole card a link.
 */
export function CentreCard({
	name = "Little Gum Tree Early Learning",
	suburb = "Surry Hills",
	distance = "1.2 km",
	rating = 4.8,
	reviews = 126,
	nqs = "Exceeding NQS",
	tags = ["Montessori", "Outdoor space", "Ages 0–5"],
	keyInfo = "Places available",
	verified = true,
	seed = 0,
	featured = false,
	href,
	style,
}: CentreCardProps) {
	const [saved, setSaved] = useState(false);

	const cardClass = cn(
		"flex bg-card border border-border rounded-xl overflow-hidden shadow-sm no-underline text-inherit transition-[box-shadow,border-color,transform] duration-180 hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5",
		featured ? "flex-row" : "flex-col",
	);

	const Inner = (
		<>
			<div className={cn("relative", featured && "flex-[0_0_44%]")}>
				<PhotoPlaceholder
					seed={seed}
					featured={featured}
				/>
				{verified && (
					<span className="absolute top-3 left-3 inline-flex items-center gap-1.25 px-2.5 py-1.25 text-xs font-semibold text-teal-700 bg-white/94 rounded-full shadow-sm">
						<Icon
							name="shield-check"
							size={13}
						/>{" "}
						Verified
					</span>
				)}
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setSaved((s) => !s);
					}}
					aria-label="Save"
					className={cn(
						"absolute top-3 right-3 inline-flex items-center justify-center w-8.5 h-8.5 rounded-full bg-white/90 border-none shadow-sm",
						saved ? "text-coral-500" : "text-muted-foreground",
					)}
				>
					<svg
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill={saved ? "var(--coral-500)" : "none"}
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M19 5.5a4.5 4.5 0 0 0-7 1 4.5 4.5 0 0 0-7-1c-2 2-1.5 5 1 7.5l6 6 6-6c2.5-2.5 3-5.5 1-7.5Z" />
					</svg>
				</button>
			</div>

			<div
				className={cn(
					"flex flex-col flex-1",
					featured
						? "p-[26px_28px] gap-3 text-left items-stretch"
						: "p-4 gap-2.25 text-center items-center",
				)}
			>
				<div
					className={cn(
						"flex items-start gap-2.5 flex-wrap",
						featured ? "justify-between" : "justify-center",
					)}
				>
					<h3
						className={cn(
							"font-semibold tracking-[-0.02em] text-foreground leading-[1.2] m-0",
							featured ? "text-2xl" : "text-[18px]",
						)}
					>
						{name}
					</h3>
					<RatingBadge rating={nqs} />
				</div>

				<div
					className={cn(
						"flex items-center gap-1.5 text-sm text-muted-foreground",
						featured ? "justify-start" : "justify-center",
					)}
				>
					<Icon
						name="map-pin"
						size={15}
					/>
					<span>
						{suburb}
						{distance ? ` · ${distance}` : ""}
					</span>
				</div>

				<div
					className={cn(
						"flex",
						featured ? "justify-start" : "justify-center",
					)}
				>
					<StarRating
						value={rating}
						count={reviews}
						size={featured ? 17 : 15}
					/>
				</div>

				<div
					className={cn(
						"flex flex-wrap gap-1.5",
						featured ? "justify-start" : "justify-center",
					)}
				>
					{tags.map((t) => (
						<Tag key={t}>{t}</Tag>
					))}
				</div>

				{keyInfo && (
					<div
						className={cn(
							"flex items-center gap-1.5 text-sm font-semibold text-coral-500",
							featured ? "justify-start" : "justify-center",
						)}
					>
						<Icon
							name="check"
							size={15}
						/>{" "}
						{keyInfo}
					</div>
				)}

				<div
					className={cn(
						"flex items-center gap-1.5 mt-auto text-sm font-semibold text-teal-600",
						featured
							? "justify-start pt-1.5"
							: "justify-center pt-1",
					)}
				>
					View details{" "}
					<Icon
						name="chevron-right"
						size={16}
					/>
				</div>
			</div>
		</>
	);

	if (href) {
		return (
			<a
				href={href}
				className={cardClass}
				style={style}
			>
				{Inner}
			</a>
		);
	}
	return (
		<div
			className={cardClass}
			style={style}
		>
			{Inner}
		</div>
	);
}
