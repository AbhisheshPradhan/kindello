"use client";

import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
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
import { Tag } from "@/components/ds/tag";
import { MapPreview, type MapPoint } from "@/components/ds/map-preview";
import { Icon } from "@/components/ds/icon";
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

// gpt-4o-mini (the default model) often ignores "call suggestFollowUps" and instead
// writes the follow-ups as prose ("...here are a couple of follow-up questions: Q1?
// Q2?"). Detect that trailer by its explicit "follow-up question(s)" marker, strip it
// from the displayed answer, and recover the questions so they still render as
// clickable chips. A legitimate single trailing question (no marker) is left alone.
function splitLeakedFollowUps(text: string): {
	body: string;
	questions: string[];
} {
	const m = text.match(/(^|\n)[^\n]*follow[\s-]?up questions?\b[^\n]*/i);
	if (!m || m.index == null) return { body: text, questions: [] };
	const cut = m.index + (m[1] ? 1 : 0); // skip a captured leading newline
	const body = text.slice(0, cut).trimEnd();
	const tail = text.slice(cut);
	const questions = (tail.match(/[^\n?]*\?/g) ?? [])
		.map((q) => q.replace(/^[\s\d.)*_>•-]+/, "").trim())
		.filter((q) => q.length > 6 && q.length <= 120);
	return { body, questions: questions.slice(0, 3) };
}

// Tool call wins; otherwise fall back to questions the model leaked into prose.
function followUpsFor(m: UIMessage): string[] {
	const tool = messageFollowUps(m);
	if (tool.length) return tool;
	return splitLeakedFollowUps(messageText(m)).questions;
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

// NQS tier ordering, best → worst (null/unknown = 0). Used to pick the superlative
// badges and summarise the result set. The NQS rating is the only real quality signal
// we hold; everything here is derived from the returned rows (no fabricated fees/reviews).
const NQS_RANK: Record<string, number> = {
	Excellent: 5,
	"Exceeding NQS": 4,
	"Meeting NQS": 3,
	"Working Towards NQS": 2,
};
function tierRank(r: string | null): number {
	return r ? (NQS_RANK[r] ?? 0) : 0;
}

// A superlative tag for a standout centre. Honest, derived facts only: NQS tier
// (the one real quality signal we hold) and distance.
type CentreBadge = { label: string; tone: "teal" | "sun" | "neutral" };

// Assign at most one superlative badge to each centre in a result set. If a
// single centre is BOTH the highest-rated and the closest it's the clear
// "Top pick"; otherwise the best-rated and the nearest are tagged separately.
// Computed over whichever subset is displayed, so a tag always lands on a
// visible row.
function centreBadges(centres: Centre[]): Map<Centre, CentreBadge> {
	const out = new Map<Centre, CentreBadge>();
	if (!centres.length) return out;

	const rated = centres.filter((c) => c.overall_rating);
	const highest = rated.length
		? [...rated].sort((a, b) => {
				const t =
					tierRank(b.overall_rating) - tierRank(a.overall_rating);
				if (t !== 0) return t;
				return (
					(a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)
				);
			})[0]
		: null;

	const withDist = centres.filter((c) => c.distance_km != null);
	const closest = withDist.length
		? withDist.reduce((a, b) =>
				(a.distance_km as number) <= (b.distance_km as number) ? a : b,
			)
		: null;

	if (highest && highest === closest) {
		out.set(highest, { label: "Top pick", tone: "teal" });
	} else {
		if (highest) out.set(highest, { label: "Highest rated", tone: "sun" });
		if (closest && !out.has(closest))
			out.set(closest, { label: "Closest", tone: "neutral" });
	}
	return out;
}

// Cross-cutting facts about the result set — all derived, never invented.
function keyNotes(centres: Centre[]): string[] {
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
	const notes = keyNotes(centres);
	if (!notes.length) return null;
	return (
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
	);
}

function FloatingCard({ centre }: { centre: Centre }) {
	return (
		<div className="bg-card border border-border rounded-lg shadow-md px-3 py-2.5 w-full flex flex-col gap-1.5">
			<div className="text-[13.5px] font-semibold text-foreground leading-[1.3] truncate">
				{centre.service_name}
			</div>
			{fullAddress(centre) && (
				<div className="text-xs text-muted-foreground leading-[1.35] truncate">
					{fullAddress(centre)}
				</div>
			)}
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
function CentreSpec({
	centre,
	rank,
	badge,
}: {
	centre: Centre;
	rank: number;
	badge?: CentreBadge;
}) {
	const rows: { label: string; value: ReactNode }[] = [];
	const addr = fullAddress(centre);
	const hours = summariseHours(centre.operating_hours);
	rows.push({
		label: "Rating",
		value: <RatingBadge rating={centre.overall_rating} />,
	});
	if (addr) rows.push({ label: "Address", value: addr });
	if (centre.service_type)
		rows.push({ label: "Type", value: centre.service_type });
	if (hours) rows.push({ label: "Hours", value: hours });
	if (centre.places != null)
		rows.push({
			label: "Places",
			value: `${centre.places} approved places`,
		});
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
				{badge && (
					<Tag
						tone={badge.tone}
						className="flex-none px-2 py-0.5 text-[11px]"
					>
						{badge.label}
					</Tag>
				)}
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

function AnswerTurn({
	text,
	centres,
	loc,
	streaming,
	onSeeMore,
}: {
	text: string;
	centres: Centre[];
	loc: Loc | null;
	streaming: boolean;
	onSeeMore: () => void;
}) {
	// Reveal the map/cards as soon as searchCentres has returned rows — don't wait
	// for the model's intro text (that's the LAST step, so gating on it left results
	// hidden behind the "Searching…" dots even though the data had already arrived).
	const ready = !streaming || text.length > 0 || centres.length > 0;
	const points = mapPoints(centres, loc);
	const answerBody = splitLeakedFollowUps(text).body;
	const shown = centres.slice(0, 3);
	const badges = centreBadges(shown);

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
					center={loc}
					height={380}
				>
					{/* Desktop: vertical column of cards floating top-right. */}
					<div className="hidden sm:flex absolute top-3 right-3 bottom-3 z-3 w-64 flex-col gap-2">
						<div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-0.5">
							{shown.map((c, i) => (
								<FloatingCard
									key={i}
									centre={c}
								/>
							))}
						</div>
						<button
							onClick={onSeeMore}
							className="flex-none flex items-center justify-center gap-2 bg-card border border-border rounded-lg shadow-md px-3 py-2.5 text-[13px] font-semibold text-foreground"
						>
							See more places <span aria-hidden>→</span>
						</button>
					</div>

					{/* Mobile: bottom-docked, horizontally-swipeable place cards (the
					    competitor's "invisible carousel"): cards snap and the next
					    one peeks off-edge, with a round arrow at the end for more. */}
					<div className="sm:hidden absolute inset-x-0 bottom-0 z-3 flex items-center gap-2.5 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-pl-4 pl-4 pr-3 pb-3 [-webkit-overflow-scrolling:touch]">
						{shown.map((c, i) => (
							<div
								key={i}
								className="snap-start shrink-0 w-[78%] max-w-65"
							>
								<FloatingCard centre={c} />
							</div>
						))}
						<button
							onClick={onSeeMore}
							aria-label="See more places"
							className="snap-start shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-card border border-border shadow-md text-[17px] font-semibold text-foreground"
						>
							<span aria-hidden>→</span>
						</button>
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
						{shown.map((c, i) => (
							<CentreSpec
								key={i}
								centre={c}
								rank={i + 1}
								badge={badges.get(c)}
							/>
						))}
					</div>
				</div>
			)}

			{streaming && !answerBody && centres.length > 0 && (
				<div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
					<span className="inline-flex gap-0.75">
						{[0, 1, 2].map((i) => (
							<span
								key={i}
								className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[typing_1s_infinite]"
								style={{ animationDelay: `${i * 0.15}s` }}
							/>
						))}
					</span>
					Writing answer…
				</div>
			)}

			{answerBody && (
				<Markdown className="ds-answer-prose">{answerBody}</Markdown>
			)}

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
			const f = followUpsFor(m);
			if (f.length) lastFollowUps = f;
		}
	}

	const lastMsg = messages[messages.length - 1];
	const lastAssistantText =
		lastMsg?.role === "assistant" ? messageText(lastMsg) : "";
	// Hide the "Searching…" dots once the in-progress turn has produced anything to
	// show — text OR centre results (the cards now render before the intro text).
	const lastAssistantCentres =
		lastMsg?.role === "assistant" ? messageCentres(lastMsg).length : 0;
	const showThinking = busy && !lastAssistantText && !lastAssistantCentres;

	// Smoothly scroll to the bottom each time the user sends a message (the page
	// itself scrolls; the composer is sticky). One-time per send — we deliberately
	// do NOT follow the streaming answer (auto-follow was removed earlier).
	const userTurns = messages.reduce(
		(n, m) => n + (m.role === "user" ? 1 : 0),
		0,
	);
	const prevUserTurns = useRef(userTurns);
	useEffect(() => {
		if (userTurns > prevUserTurns.current) {
			requestAnimationFrame(() =>
				window.scrollTo({
					top: document.documentElement.scrollHeight,
					behavior: "smooth",
				}),
			);
		}
		prevUserTurns.current = userTurns;
	}, [userTurns]);

	return (
		<div className="w-full flex flex-col flex-1">
			{/* Tabs bar */}
			<div className="sticky top-13.75 z-20 bg-background max-w-190 mx-auto px-4 sm:px-6 w-full pt-2.5">
				<ConversationTabs
					active={tab}
					placesCount={lastCentres.length || null}
					onSelect={onSelectTab}
					onNewSearch={onNewSearch}
				/>
			</div>

			<div
				className={`mx-auto px-4 sm:px-6 w-full pt-2.5 flex flex-col flex-1 ${tab === "places" ? "" : "max-w-190"}`}
			>
				{tab === "answer" || lastCentres.length === 0 ? (
					<>
						<div className="flex flex-col flex-1 max-w-190 mx-auto w-full pt-6 pb-6">
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
												onSeeMore={() =>
													onSelectTab("places")
												}
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
						</div>

						{/* Floating composer — a detached card that HOVERS over the
					    transcript (no full-width footer strip): the transcript
					    scrolls underneath it. The wrapper is click-through so
					    scroll/clicks pass through the margins; only the card
					    itself captures input. */}
						<div className="pointer-events-none sticky inset-x-0 bottom-0 pb-4">
							<div className="pointer-events-auto rounded-xl shadow-lg">
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
						<div className="w-full">
							<p className="text-sm text-muted-foreground mb-5">
								Place results
								{lastQuery && (
									<>
										{" for: "}
										<span className="text-body">
											{lastQuery}
										</span>
									</>
								)}
							</p>
							{lastCentres.length === 0 ? (
								<p className="text-muted-foreground">
									No places to show yet. Ask a question on the
									Answer tab first.
								</p>
							) : (
								<div className="ds-places-layout">
									<div className="grid gap-4 self-start justify-start grid-cols-1 min-[480px]:grid-cols-[repeat(auto-fill,minmax(220px,240px))]">
										{lastCentres.map((c, i) => (
											<PlaceResultCard
												key={i}
												name={c.service_name}
												suburb={c.suburb ?? ""}
												address={
													[
														c.service_address,
														c.suburb,
														c.state,
														c.postcode,
													]
														.filter(Boolean)
														.join(", ") || null
												}
												verified={false}
												rating={nqsStar(
													c.overall_rating,
												)}
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
									<div className="sticky top-6 self-start hidden min-[1000px]:block">
										<MapPreview
											points={mapPoints(
												lastCentres,
												lastLoc,
											)}
											center={lastLoc}
											height="calc(100dvh - 160px)"
											showLabels
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
