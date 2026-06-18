import { RatingTag } from "@/components/ds/rating-tag";
import { Icon } from "@/components/ds/icon";
import type { MapPoint } from "@/components/ds/map-preview";

// The card shown when a map pin is clicked. The WHOLE card links to the centre's detail
// page (new tab). Mounted into the Mapbox popup via createRoot so it reuses RatingTag.
export function PinCard({ p }: { p: MapPoint }) {
	const inner = (
		<>
			<div className="font-semibold text-[15px] leading-snug pr-5 text-foreground transition-colors group-hover:text-teal-700">
				{p.label ?? "Centre"}
			</div>

			{p.serviceType && (
				<div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
					{p.serviceType}
				</div>
			)}

			{typeof p.rating === "string" && p.rating && (
				<div className="mt-2.5">
					<RatingTag rating={p.rating} size="sm" />
				</div>
			)}

			{p.address && (
				<div className="mt-2.5 flex items-start gap-1.5 text-[12px] text-muted-foreground leading-snug">
					<span className="shrink-0 mt-px text-muted-foreground/70">
						<Icon name="map-pin" size={13} />
					</span>
					<span>{p.address}</span>
				</div>
			)}

			{p.hours && (
				<div className="mt-2 flex items-start gap-1.5 text-[12px] text-muted-foreground leading-snug">
					<span className="shrink-0 mt-px text-muted-foreground/70">
						<Icon name="clock" size={13} />
					</span>
					<span>{p.hours}</span>
				</div>
			)}
		</>
	);

	const cls = "group block w-64 p-4 no-underline bg-card text-foreground";
	return p.id ? (
		<a
			href={`/centre/${p.id}`}
			target="_blank"
			rel="noopener noreferrer"
			className={cls}
		>
			{inner}
		</a>
	) : (
		<div className={cls}>{inner}</div>
	);
}
