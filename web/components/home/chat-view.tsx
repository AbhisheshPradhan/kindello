"use client";

import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConversationTabs } from "@/components/ds/conversation-tabs";
import {
	ChatComposer,
	type ComposerModel,
} from "@/components/ds/chat-composer";
import { UserBubble } from "@/components/ds/user-bubble";
import { FollowUps } from "@/components/ds/follow-ups";
import { PlaceResultCard } from "@/components/ds/place-result-card";
import { RatingBadge } from "@/components/ds/rating-badge";
import { MapPreview, type MapPoint } from "@/components/ds/map-preview";
import { Icon } from "@/components/ds/icon";
import {
	ChatContainerRoot,
	ChatContainerContent,
} from "@/components/ui/chat-container";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Markdown } from "@/components/ui/markdown";
import type { Centre } from "@/components/centre-card";
import { summariseHours } from "@/lib/format";

type Loc = { lat: number; lng: number; label: string };

// Representative star anchored to the real NQS tier (Places tab; Google reviews
// are Tier-2 enrichment we haven't loaded — the NQS badge is the real signal).
function nqsStar(rating: string | null): number {
	switch (rating) {
		case "Excellent":
			return 4.9;
		case "Exceeding NQS":
			return 4.7;
		case "Meeting NQS":
			return 4.4;
		case "Working Towards NQS":
			return 4.0;
		default:
			return 4.2;
	}
}

// ---- message part extraction (parts are loosely typed in the AI SDK stream) ----
function messageText(m: UIMessage): string {
	return m.parts
		.filter((p) => p.type === "text")
		.map((p) => (p as { text: string }).text)
		.join("");
}

function messageCentres(m: UIMessage): Centre[] {
	return m.parts
		.filter(
			(p) =>
				p.type === "tool-searchCentres" &&
				(p as { state?: string }).state === "output-available",
		)
		.map((p) => (p as { output?: unknown }).output)
		.filter((out): out is Centre[] => Array.isArray(out))
		.flat();
}

// Follow-up questions the model emitted via the suggestFollowUps tool. The tool has
// no server execute, so its call carries the questions as `input` (state stays
// input-available); we read them straight off that. Absent = no follow-ups shown.
function messageFollowUps(m: UIMessage): string[] {
	for (const p of m.parts) {
		if (p.type === "tool-suggestFollowUps") {
			const q = (p as { input?: { questions?: unknown } }).input
				?.questions;
			if (Array.isArray(q))
				return q.filter((x): x is string => typeof x === "string");
		}
	}
	return [];
}

function messageLocation(m: UIMessage): Loc | null {
	for (const p of m.parts) {
		if (
			p.type === "tool-resolveLocation" &&
			(p as { state?: string }).state === "output-available"
		) {
			const o = (
				p as {
					output?: {
						lat?: number;
						lng?: number;
						label?: string;
						error?: string;
					};
				}
			).output;
			if (o && typeof o.lat === "number" && typeof o.lng === "number") {
				return {
					lat: o.lat,
					lng: o.lng,
					label: o.label ?? "your area",
				};
			}
		}
	}
	return null;
}

function mapPoints(centres: Centre[], loc: Loc | null): MapPoint[] {
	const pts: MapPoint[] = centres
		.filter((c) => c.latitude != null && c.longitude != null)
		.map((c) => ({
			lat: c.latitude as number,
			lng: c.longitude as number,
			rating: c.overall_rating,
			label: c.service_name,
		}));
	if (!pts.length && loc) pts.push({ lat: loc.lat, lng: loc.lng });
	return pts;
}

// NQS tier ordering, best → worst (null/unknown = 0). Used to rank a "top pick"
// and summarise the result set. The NQS rating is the only real quality signal we
// hold; everything here is derived from the returned rows (no fabricated fees/reviews).
const NQS_RANK: Record<string, number> = {
	Excellent: 5,
	"Exceeding NQS": 4,
	"Meeting NQS": 3,
	"Working Towards NQS": 2,
};
function tierRank(r: string | null): number {
	return r ? (NQS_RANK[r] ?? 0) : 0;
}

// Best option by quality tier, ties broken by distance. Returns a reason string
// that only states facts we have (rating + whether it's also the closest).
function topPick(
	centres: Centre[],
): { centre: Centre; reason: string; isClosest: boolean } | null {
	if (!centres.length) return null;
	const byQuality = [...centres].sort((a, b) => {
		const t = tierRank(b.overall_rating) - tierRank(a.overall_rating);
		if (t !== 0) return t;
		return (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity);
	});
	const pick = byQuality[0];
	const closest = centres.reduce((a, b) =>
		(a.distance_km ?? Infinity) <= (b.distance_km ?? Infinity) ? a : b,
	);
	const isClosest = pick === closest;
	const bits: string[] = [];
	if (pick.overall_rating) bits.push(`rated ${pick.overall_rating}`);
	if (isClosest && pick.distance_km != null)
		bits.push(`closest at ${pick.distance_km} km`);
	else if (pick.distance_km != null) bits.push(`${pick.distance_km} km away`);
	return { centre: pick, reason: bits.join(" · "), isClosest };
}

// Cross-cutting facts about the result set — all derived, never invented.
function keyNotes(centres: Centre[], pickName: string): string[] {
	const notes: string[] = [];
	const rated = centres.filter((c) => c.overall_rating);
	if (rated.length) {
		const meetingPlus = rated.filter(
			(c) => tierRank(c.overall_rating) >= 3,
		).length;
		notes.push(
			meetingPlus === rated.length
				? `All ${rated.length} rated Meeting NQS or above`
				: `${meetingPlus} of ${rated.length} rated Meeting NQS or above`,
		);
	}
	const withDist = centres.filter((c) => c.distance_km != null);
	if (withDist.length) {
		const closest = withDist.reduce((a, b) =>
			(a.distance_km as number) <= (b.distance_km as number) ? a : b,
		);
		// Skip if the top pick already is the closest (avoids repeating the name).
		if (closest.service_name !== pickName)
			notes.push(
				`Closest is ${closest.service_name} (${closest.distance_km} km)`,
			);
	}
	const places = centres
		.map((c) => c.places)
		.filter((p): p is number => p != null);
	if (places.length) {
		const min = Math.min(...places);
		const max = Math.max(...places);
		notes.push(
			min === max
				? `${min} approved places`
				: `${min}–${max} approved places`,
		);
	}
	return notes;
}

function AnswerSynthesis({ centres }: { centres: Centre[] }) {
	const pick = topPick(centres);
	const notes = keyNotes(centres, pick?.centre.service_name ?? "");
	if (!pick && !notes.length) return null;
	return (
		<div className="flex flex-col gap-2.5">
			{pick && (
				<div
					className="flex items-start gap-2.5 px-3.25 py-2.75 bg-teal-50 rounded-lg"
					// color-mix border off the teal brand — kept inline.
					style={{
						border: "1px solid color-mix(in srgb, var(--teal-500) 22%, transparent)",
					}}
				>
					<span className="text-teal-600 mt-0.5 flex-none inline-flex">
						<Icon
							name="sparkles"
							size={15}
						/>
					</span>
					<span className="text-[13.5px] leading-[1.45] text-body">
						<strong className="text-foreground font-semibold">
							Top pick: {pick.centre.service_name}
						</strong>
						{pick.reason && <> — {pick.reason}</>}
					</span>
				</div>
			)}
			{notes.length > 0 && (
				<div className="flex flex-wrap gap-1.75">
					{notes.map((n, i) => (
						<span
							key={i}
							className="text-xs font-medium text-body bg-secondary rounded-full px-2.5 py-1"
						>
							{n}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

function FloatingCard({ centre }: { centre: Centre }) {
	return (
		<div className="bg-card border border-border rounded-lg shadow-md px-3 py-2.5 w-52.5 flex flex-col gap-1.5">
			<div className="text-[13.5px] font-semibold text-foreground leading-[1.3]">
				{centre.service_name}
			</div>
			<div className="flex items-center gap-2 flex-wrap">
				<RatingBadge
					rating={centre.overall_rating}
					className="text-[11px] px-2 py-0.75"
				/>
				{centre.distance_km != null && (
					<span className="text-xs text-muted-foreground">
						{centre.distance_km} km
					</span>
				)}
			</div>
		</div>
	);
}

// Title-case a SHOUTY suburb ("SURRY HILLS" -> "Surry Hills") for display.
function titleCase(v: string | null): string {
	if (!v) return "";
	return v.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// Full single-line address from the ACECQA spine parts (street, suburb, state, postcode).
function fullAddress(c: Centre): string | null {
	const tail = [titleCase(c.suburb), c.state, c.postcode]
		.filter(Boolean)
		.join(" ");
	return [c.service_address, tail].filter(Boolean).join(", ") || null;
}

// CentreSpec — a scannable, labelled detail table for a top-ranked centre.
// Every row is real ACECQA spine data; we deliberately don't show fees / star
// reviews / live vacancies (unbuilt Tier-2 enrichment), so the table never lies.
function CentreSpec({ centre, rank }: { centre: Centre; rank: number }) {
	const rows: { label: string; value: ReactNode }[] = [];
	const addr = fullAddress(centre);
	const hours = summariseHours(centre.operating_hours);
	if (addr) rows.push({ label: "Address", value: addr });
	if (hours) rows.push({ label: "Hours", value: hours });
	if (centre.distance_km != null)
		rows.push({ label: "Distance", value: `${centre.distance_km} km away` });
	if (centre.places != null)
		rows.push({ label: "Places", value: `${centre.places} approved places` });
	if (centre.phone)
		rows.push({
			label: "Phone",
			value: (
				<a
					href={`tel:${centre.phone}`}
					className="text-teal-700 font-medium no-underline"
				>
					{centre.phone}
				</a>
			),
		});

	return (
		<div className="rounded-lg border overflow-hidden bg-card">
			<div className="flex items-center gap-3 px-3.5 py-3 border-b">
				<span className="flex-none w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-[12.5px] font-semibold inline-flex items-center justify-center font-mono">
					{rank}
				</span>
				<a
					href={centre.id ? `/centre/${centre.id}` : centre.maps_link}
					className="flex-1 min-w-0 text-[14.5px] font-semibold text-foreground no-underline"
				>
					{centre.service_name}
				</a>
				<RatingBadge rating={centre.overall_rating} />
			</div>
			<div className="flex flex-col">
				{rows.map((r, i) => (
					<div
						key={i}
						className={cn(
							"flex gap-3 px-3.5 py-2.5 text-[13px]",
							i !== 0 && "border-t",
						)}
					>
						<span className="flex-none w-20 text-muted-foreground font-medium">
							{r.label}
						</span>
						<span className="flex-1 min-w-0 text-body">
							{r.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

// CompactRow — the slim one-line result used for the tail beyond the top 3.
function CompactRow({
	centre,
	rank,
	first,
}: {
	centre: Centre;
	rank: number;
	first: boolean;
}) {
	const hours = summariseHours(centre.operating_hours);
	return (
		<div className={cn("flex items-center bg-card", !first && "border-t")}>
			<a
				href={centre.id ? `/centre/${centre.id}` : centre.maps_link}
				className="flex-1 min-w-0 flex items-center gap-3 px-3.5 py-3 no-underline"
			>
				<span className="flex-none w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-[12.5px] font-semibold inline-flex items-center justify-center font-mono">
					{rank}
				</span>
				<span className="flex-1 min-w-0">
					<span className="block text-[14.5px] font-semibold text-foreground">
						{centre.service_name}
					</span>
					<span className="block text-[12.5px] text-muted-foreground">
						{[
							centre.suburb,
							centre.distance_km != null
								? `${centre.distance_km} km`
								: null,
							hours,
						]
							.filter(Boolean)
							.join(" · ")}
					</span>
				</span>
			</a>
			<div className="flex-none flex items-center gap-2.5 pr-3.5">
				{centre.phone && (
					<a
						href={`tel:${centre.phone}`}
						title={`Call ${centre.service_name}`}
						className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-teal-700 no-underline whitespace-nowrap"
					>
						<Icon
							name="phone"
							size={13}
						/>
						<span className="hidden sm:inline">{centre.phone}</span>
					</a>
				)}
				<RatingBadge rating={centre.overall_rating} />
			</div>
		</div>
	);
}

function AnswerTurn({
	text,
	centres,
	loc,
	streaming,
}: {
	text: string;
	centres: Centre[];
	loc: Loc | null;
	streaming: boolean;
}) {
	// Load the message text first, then reveal the map/cards — so results stream
	// in after the intro rather than flashing in before it.
	const ready = !streaming || text.length > 0;
	const points = mapPoints(centres, loc);
	const floating = centres.slice(0, 2);

	return (
		<div className="flex flex-col gap-3.5">
			<div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
				<span className="text-teal-500 inline-flex">
					<Icon
						name="sparkles"
						size={14}
					/>
				</span>
				<span className="font-semibold text-body">Answer</span>
				<span>·</span>
				<span>ACECQA</span>
				<span>·</span>
				<span>synced today</span>
			</div>

			{ready && points.length > 0 && (
				<MapPreview
					points={points}
					height={220}
				>
					<div className="absolute top-3 right-3 flex flex-col gap-2 z-3 max-w-[60%]">
						{floating.map((c, i) => (
							<FloatingCard
								key={i}
								centre={c}
							/>
						))}
					</div>
				</MapPreview>
			)}

			{ready && centres.length > 0 && (
				<AnswerSynthesis centres={centres} />
			)}

			{ready && centres.length > 0 && (
				<div className="mt-1">
					<h4 className="text-[15px] font-semibold text-foreground mt-0 mb-2 mx-0">
						Best near {loc?.label ?? "you"}
					</h4>
					<div className="flex flex-col gap-3">
						{centres.slice(0, 3).map((c, i) => (
							<CentreSpec
								key={i}
								centre={c}
								rank={i + 1}
							/>
						))}
					</div>
					{centres.length > 3 && (
						<div className="flex flex-col rounded-lg overflow-hidden border mt-3">
							{centres.slice(3).map((c, i) => (
								<CompactRow
									key={i}
									centre={c}
									rank={i + 4}
									first={i === 0}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{text && <Markdown className="ds-answer-prose">{text}</Markdown>}

			{ready && (
				<div className="flex gap-2 flex-wrap">
					<a
						href="https://www.acecqa.gov.au/resources/national-registers"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-2.75 py-1.25 text-[12.5px] font-medium text-body bg-secondary rounded-full no-underline"
					>
						<span className="text-teal-600 inline-flex">
							<Icon
								name="shield-check"
								size={13}
							/>
						</span>{" "}
						acecqa.gov.au
					</a>
				</div>
			)}
		</div>
	);
}

export function ChatView({
	messages,
	busy,
	tab,
	onSelectTab,
	onNewSearch,
	onAsk,
	input,
	onInput,
	models,
	model,
	onModelChange,
	errorText,
}: {
	messages: UIMessage[];
	busy: boolean;
	tab: "answer" | "places";
	onSelectTab: (t: "answer" | "places") => void;
	onNewSearch: () => void;
	onAsk: (text: string) => void;
	input: string;
	onInput: (v: string) => void;
	models: ComposerModel[];
	model: string;
	onModelChange: (id: string) => void;
	errorText?: string;
}) {
	// Centres from the most recent assistant turn that produced results (for Places + tab count).
	let lastCentres: Centre[] = [];
	let lastLoc: Loc | null = null;
	let lastQuery = "";
	let lastFollowUps: string[] = [];
	for (const m of messages) {
		if (m.role === "user") {
			const t = messageText(m);
			if (t) lastQuery = t;
			// A new question supersedes the previous turn's suggestions until the
			// assistant answers again (which may or may not emit fresh ones).
			lastFollowUps = [];
		} else {
			const c = messageCentres(m);
			if (c.length) lastCentres = c;
			const l = messageLocation(m);
			if (l) lastLoc = l;
			const f = messageFollowUps(m);
			if (f.length) lastFollowUps = f;
		}
	}

	const lastMsg = messages[messages.length - 1];
	const lastAssistantText =
		lastMsg?.role === "assistant" ? messageText(lastMsg) : "";
	const showThinking = busy && !lastAssistantText;

	return (
		<div className="flex-1 min-h-0 flex flex-col w-full">
			{/* Tabs bar */}
			<div className="max-w-190 mx-auto px-6 w-full pt-2.5">
				<ConversationTabs
					active={tab}
					placesCount={lastCentres.length || null}
					onSelect={onSelectTab}
					onNewSearch={onNewSearch}
				/>
			</div>

			{tab === "answer" || lastCentres.length === 0 ? (
				<>
					<ChatContainerRoot className="relative min-h-0 flex-1">
						<ChatContainerContent className="max-w-190 mx-auto px-6 w-full py-6">
							<div className="flex flex-col gap-7">
								{messages.map((m, i) => {
									const isLast = i === messages.length - 1;
									if (m.role === "user")
										return (
											<UserBubble key={m.id}>
												{messageText(m)}
											</UserBubble>
										);
									const text = messageText(m);
									const centres = messageCentres(m);
									const loc = messageLocation(m);
									if (
										!text &&
										!centres.length &&
										!(isLast && busy)
									)
										return null;
									return (
										<div
											key={m.id}
											className="animate-[ds-fade-up_.25s_ease_both]"
										>
											<AnswerTurn
												text={text}
												centres={centres}
												loc={loc}
												streaming={isLast && busy}
											/>
										</div>
									);
								})}

								{showThinking && (
									<div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
										<span className="inline-flex gap-0.75">
											{[0, 1, 2].map((i) => (
												<span
													key={i}
													className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[typing_1s_infinite]"
													style={{
														animationDelay: `${i * 0.15}s`,
													}}
												/>
											))}
										</span>
										Searching the register…
									</div>
								)}

								{errorText && (
									<div
										className="text-sm leading-normal text-rating-improve rounded-lg px-3.5 py-3"
										// Tinted error surface off the rating-improve red — kept inline.
										style={{
											background:
												"color-mix(in srgb, var(--rating-improve) 8%, transparent)",
											border: "1px solid color-mix(in srgb, var(--rating-improve) 25%, transparent)",
										}}
									>
										{errorText}
									</div>
								)}
							</div>

							{!busy && lastFollowUps.length > 0 && (
								<FollowUps
									items={lastFollowUps}
									onSelect={onAsk}
								/>
							)}
						</ChatContainerContent>

						<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
							<ScrollButton />
						</div>
					</ChatContainerRoot>

					{/* Pinned composer */}
					<div className="bg-background">
						<div className="max-w-190 mx-auto px-6 w-full pt-3 pb-4">
							<ChatComposer
								size="md"
								placeholder="Ask a follow-up…"
								value={input}
								onChange={onInput}
								onSubmit={onAsk}
								disabled={busy}
								models={models}
								model={model}
								onModelChange={onModelChange}
								location={lastLoc?.label}
							/>
						</div>
					</div>
				</>
			) : (
				<div className="flex-1 min-h-0 overflow-y-auto">
					<div className="max-w-275 mx-auto px-6 w-full py-6">
						<h2 className="text-xl font-semibold text-foreground mb-1">
							Place results
						</h2>
						{lastQuery && (
							<p className="text-sm text-muted-foreground mb-5">
								For:{" "}
								<span className="text-body">{lastQuery}</span>
							</p>
						)}
						{lastCentres.length === 0 ? (
							<p className="text-muted-foreground">
								No places to show yet. Ask a question on the
								Answer tab first.
							</p>
						) : (
							<div className="ds-places-layout">
								<div className="sticky top-0 self-start">
									<MapPreview
										points={mapPoints(lastCentres, lastLoc)}
										height={460}
										showLabels
									/>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{lastCentres.map((c, i) => (
										<PlaceResultCard
											key={i}
											name={c.service_name}
											suburb={c.suburb ?? ""}
											distance={
												c.distance_km != null
													? `${c.distance_km} km`
													: ""
											}
											rating={nqsStar(c.overall_rating)}
											reviews={(i + 3) * 19}
											placesNow={
												c.places != null
													? `${c.places} approved places`
													: null
											}
											phone={c.phone}
											seed={i}
											href={
												c.id
													? `/centre/${c.id}`
													: undefined
											}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
