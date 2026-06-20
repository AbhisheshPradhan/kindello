"use client";

import { useState } from "react";
import { Icon } from "@/components/ds/icon";

const GRADS = [
	"linear-gradient(135deg,#2fb3b3,#1ca6a6 60%,#136d6d)",
	"linear-gradient(135deg,#ffc83d,#ff8166 70%,#f9603f)",
	"linear-gradient(135deg,#57c5c5,#2fb3b3 60%,#158888)",
];

// One gallery tile: real photo (cover); on load error it falls back to a soft
// gradient so the layout never shows a broken image.
function Tile({
	src,
	alt,
	grad,
	children,
}: {
	src?: string;
	alt: string;
	grad: string;
	children?: React.ReactNode;
}) {
	const [err, setErr] = useState(false);
	return (
		<div
			className="relative h-full w-full overflow-hidden rounded-xl"
			style={!src || err ? { background: grad } : undefined}
		>
			{src && !err && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={src}
					alt={alt}
					onError={() => setErr(true)}
					className="h-full w-full object-cover"
					loading="lazy"
				/>
			)}
			{children}
		</div>
	);
}

// Small brand-logo chip over the hero — never the hero itself.
function LogoBadge({ src, alt }: { src: string; alt: string }) {
	const [err, setErr] = useState(false);
	if (err) return null;
	return (
		<span className="absolute bottom-3 left-3 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-white shadow-sm">
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

/**
 * Detail-page gallery: a large hero (best ranked photo) + two stacked thumbnails.
 * No photos -> "Photos coming soon" placeholder (stock image later — never the
 * logo). A logo, if any, rides as a small badge over the hero.
 */
export function DetailGallery({
	images,
	logo,
	name,
	seed,
}: {
	images: string[];
	logo: string | null;
	name: string;
	seed: number;
}) {
	if (images.length === 0) {
		return (
			<div className="mt-7 h-85 overflow-hidden rounded-xl">
				<div
					className="relative flex h-full w-full items-center justify-center"
					style={{ background: GRADS[seed % GRADS.length] }}
				>
					<span className="text-white/50">
						<Icon name="baby" size={72} strokeWidth={1.5} />
					</span>
					<span className="absolute bottom-3 left-3 rounded-full bg-white/92 px-2.75 py-1.25 text-xs font-semibold text-teal-700">
						Photos coming soon
					</span>
					{logo && <LogoBadge src={logo} alt={name} />}
				</div>
			</div>
		);
	}

	const [hero, ...rest] = images;
	const thumbs = rest.slice(0, 2);
	const extra = images.length - 1 - thumbs.length;

	return (
		<div className="mt-7 grid h-85 grid-cols-[2fr_1fr] gap-3">
			<Tile src={hero} alt={name} grad={GRADS[seed % GRADS.length]}>
				{logo && <LogoBadge src={logo} alt={name} />}
			</Tile>
			<div className="grid grid-rows-[1fr_1fr] gap-3">
				{[0, 1].map((i) => (
					<Tile
						key={i}
						src={thumbs[i]}
						alt={name}
						grad={GRADS[(seed + i + 1) % GRADS.length]}
					>
						{i === 1 && extra > 0 && thumbs[1] && (
							<span className="absolute inset-0 flex items-center justify-center bg-black/40 text-lg font-semibold text-white">
								+{extra} more
							</span>
						)}
					</Tile>
				))}
			</div>
		</div>
	);
}
