"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarRating } from "@/components/ds/star-rating";
import { RatingTag } from "@/components/ds/rating-tag";
import { Icon } from "@/components/ds/icon";
import { summariseHours } from "@/lib/format";
import { centrePath } from "@/lib/slugs";
import type { DirectoryCentre } from "@/lib/directory";

// Lightweight localStorage set toggle — backs "Save for later" / "Add to compare" until
// the dedicated saved/compare pages land (parked). Persists the selection per device.
function useToggle(key: string, id: string): [boolean, () => void] {
	const [on, setOn] = useState(false);
	useEffect(() => {
		try {
			const s = new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
			setOn(s.has(id));
		} catch {
			/* ignore */
		}
	}, [key, id]);
	const toggle = () => {
		try {
			const s = new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
			s.has(id) ? s.delete(id) : s.add(id);
			localStorage.setItem(key, JSON.stringify([...s]));
			setOn(s.has(id));
		} catch {
			/* ignore */
		}
	};
	return [on, toggle];
}

// Soft brand gradients for the photo-less placeholder (deterministic per centre).
const PLACEHOLDER_GRADS = [
	"from-teal-100 to-teal-50",
	"from-amber-100 to-amber-50",
	"from-teal-50 to-amber-50",
	"from-amber-50 to-teal-100",
];

// Small brand-logo chip, shown over the hero/placeholder — never as the hero itself.
function LogoBadge({ src, alt }: { src: string; alt: string }) {
	const [err, setErr] = useState(false);
	if (err) return null;
	return (
		<span className="absolute bottom-2 left-2 inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-white shadow-sm">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={alt}
				onError={() => setErr(true)}
				className="h-full w-full object-contain p-1"
				loading="lazy"
			/>
		</span>
	);
}

// Card media: the ranked hero photo (cover) or a gradient placeholder (stock image
// later). A logo, if any, rides as a small badge — it is never the hero.
function CardMedia({ centre }: { centre: DirectoryCentre }) {
	const [failed, setFailed] = useState(false);
	const show = centre.image && !failed;
	return (
		<div className="relative h-40 w-full">
			{show ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={centre.image!}
					alt={centre.name}
					onError={() => setFailed(true)}
					className="h-40 w-full bg-muted object-cover"
					loading="lazy"
				/>
			) : (
				<div
					className={`flex h-40 w-full items-center justify-center bg-linear-to-br ${
						PLACEHOLDER_GRADS[centre.seed % PLACEHOLDER_GRADS.length]
					}`}
				>
					<span className="text-teal-600/35">
						<Icon name="baby" size={40} strokeWidth={1.5} />
					</span>
				</div>
			)}
			{centre.logo && <LogoBadge src={centre.logo} alt={centre.name} />}
		</div>
	);
}

// Directory list card: hero/logo image, Google rating + NQS rating, name,
// address, hours, then compare/save actions.
export function CentreListCard({ centre }: { centre: DirectoryCentre }) {
	const [compared, toggleCompare] = useToggle("kindello:compare", centre.id);
	const [saved, toggleSave] = useToggle("kindello:saved", centre.id);
	const hours = summariseHours(centre.operatingHours);
	const address =
		[centre.address, centre.suburb, centre.state, centre.postcode]
			.filter(Boolean)
			.join(", ") || null;

	return (
		<div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow">
			<Link href={centrePath(centre)} aria-label={centre.name}>
				<CardMedia centre={centre} />
			</Link>
			<div className="flex flex-col gap-2 p-4 flex-1">
				{/* Google rating | NQS rating */}
				<div className="flex items-center justify-between gap-2">
					<StarRating value={centre.stars} count={centre.reviews} size={14} />
					<RatingTag rating={centre.rating} size="sm" />
				</div>

				<Link
					href={centrePath(centre)}
					className="font-semibold text-[16px] leading-snug text-foreground hover:text-teal-700 transition-colors"
				>
					{centre.name}
				</Link>

				{address && (
					<div className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-snug">
						<span className="mt-px shrink-0">
							<Icon name="map-pin" size={14} />
						</span>
						<span>{address}</span>
					</div>
				)}

				{hours && (
					<div className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-snug">
						<span className="mt-px shrink-0">
							<Icon name="clock" size={14} />
						</span>
						<span>{hours}</span>
					</div>
				)}

				{/* Actions */}
				<div className="mt-auto pt-3 grid grid-cols-2 gap-2">
					<ActionButton
						active={compared}
						onClick={toggleCompare}
						icon="check"
						label={compared ? "Added" : "Add to compare"}
					/>
					<ActionButton
						active={saved}
						onClick={toggleSave}
						icon="heart"
						label={saved ? "Saved" : "Save for later"}
					/>
				</div>
			</div>
		</div>
	);
}

function ActionButton({
	active,
	onClick,
	icon,
	label,
}: {
	active: boolean;
	onClick: () => void;
	icon: string;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[12.5px] font-semibold transition-colors ${
				active
					? "border-teal-300 bg-teal-50 text-teal-700"
					: "border-border bg-card text-body hover:border-muted-foreground/40"
			}`}
		>
			<Icon name={icon} size={14} />
			<span className="truncate">{label}</span>
		</button>
	);
}
