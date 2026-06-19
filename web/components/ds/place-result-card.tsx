"use client";

import type { CSSProperties } from "react";
import { formatAuPhone } from "@/lib/utils";
import { Icon } from "./icon";
import { RatingTag } from "./rating-tag";

const GRADS = [
	"linear-gradient(135deg,#2fb3b3,#136d6d)",
	"linear-gradient(135deg,#57c5c5,#158888)",
	"linear-gradient(135deg,#ffc83d,#ff8166)",
	"linear-gradient(135deg,#ffd766,#f5b125)",
	"linear-gradient(135deg,#2fb3b3,#57c5c5)",
	"linear-gradient(135deg,#ff8166,#f9603f)",
];

const MORE_INFO_CLASS =
	"mt-auto border border-border rounded-md text-center p-2.25 font-sans text-[13.5px] font-semibold text-body bg-card no-underline";

/**
 * PlaceResultCard — the larger result card used in the Places-tab grid beside
 * the map: photo + Verified badge, name, rating, accent "places now" line,
 * address and phone, and a "More info" affordance.
 */
export function PlaceResultCard({
	name = "Little Gum Tree Early Learning",
	suburb = "Surry Hills",
	address = null,
	rating = 4.8,
	reviews = 126,
	placesNow = "3 places now",
	phone = null,
	verified = true,
	seed = 0,
	href,
	onMore,
	style,
	nqsRating,
}: {
	name?: string;
	suburb?: string;
	address?: string | null;
	rating?: number;
	reviews?: number;
	placesNow?: string | null;
	phone?: string | null;
	verified?: boolean;
	seed?: number;
	href?: string;
	onMore?: () => void;
	style?: CSSProperties;
	/** Raw ACECQA NQS rating — when set, renders the canonical RatingTag on the card. */
	nqsRating?: string | null;
}) {
	return (
		<div
			className="flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-xs min-h-92 h-full"
			style={style}
		>
			<div
				className="h-40 shrink-0 relative"
				style={{ background: GRADS[seed % GRADS.length] }}
			>
				{verified && (
					<span className="absolute top-2.25 left-2.25 inline-flex items-center gap-1 px-2.25 py-0.75 text-[11px] font-semibold text-teal-700 bg-white/94 rounded-full">
						<Icon
							name="shield-check"
							size={11}
						/>{" "}
						Verified
					</span>
				)}
			</div>
			<div className="px-3.75 pt-3.25 pb-3.75 flex flex-col gap-2.25 flex-1">
				<div className="text-[15.5px] font-semibold text-foreground truncate">
					{name}
				</div>
				{nqsRating !== undefined && (
					<div>
						<RatingTag
							rating={nqsRating}
							size="sm"
						/>
					</div>
				)}
				<div className="text-[13.5px] text-body flex items-center gap-1.5">
					<span className="text-sun-400">★</span>
					<strong className="text-foreground font-semibold font-mono">
						{rating.toFixed(1)}
					</strong>
					<span className="text-muted-foreground">({reviews})</span>
					{placesNow && (
						<>
							<span className="text-border">·</span>
							<span className="text-teal-600 font-semibold">
								{placesNow}
							</span>
						</>
					)}
				</div>
				<div className="text-[13px] text-muted-foreground flex items-center gap-1.75 min-w-0">
					<Icon
						name="map-pin"
						size={14}
						className="shrink-0"
					/>
					<span className="truncate">{address ?? suburb}</span>
				</div>
				{phone && (
					<div className="text-[13px] text-muted-foreground inline-flex items-center gap-1.75">
						<Icon
							name="phone"
							size={14}
						/>{" "}
						{formatAuPhone(phone)}
					</div>
				)}
				{href ? (
					<a
						href={href}
						className={MORE_INFO_CLASS}
					>
						More info
					</a>
				) : (
					<button
						onClick={onMore}
						className={MORE_INFO_CLASS}
					>
						More info
					</button>
				)}
			</div>
		</div>
	);
}
