"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import type { DirectoryCentre, CategoryCount } from "@/lib/directory";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { ChatComposer } from "@/components/ds/chat-composer";
import { PromptChip } from "@/components/ds/prompt-chip";
import { Icon } from "@/components/ds/icon";
import { ContinueSearchCard } from "@/components/ds/continue-search-card";
import { MarketingSections } from "./marketing-sections";
import {
	recentChats,
	recordRecent,
	setPending,
	type RecentChat,
} from "@/lib/chat-storage";

const PROMPT_CHIPS = [
	"Long day care for a 2 year old near Gladesville rated Exceeding",
	"After school care for a 6 year old near Parramatta",
	"Kindergarten for a 4 year old around postcode 2026",
	"Before school care close to Surry Hills",
];

const TYPED = [
	"Long day care for a 2 year old near Parramatta",
	"Montessori preschool in Surry Hills, outdoor space",
	"After school care close to Lakemba",
	"Top rated centres near Newcastle, places now",
];

const COMPOSER_MODELS = MODELS.map((m) => ({ id: m.id, label: m.label }));

function useTypewriter(words: string[], enabled: boolean) {
	const [index, setIndex] = useState(0);
	const [text, setText] = useState("");
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!enabled) return;
		const word = words[index % words.length];
		if (!deleting && text === word) {
			const hold = setTimeout(() => setDeleting(true), 1800);
			return () => clearTimeout(hold);
		}
		if (deleting && text === "") {
			setDeleting(false);
			setIndex((i) => i + 1);
			return;
		}
		const step = setTimeout(
			() =>
				setText((t) =>
					deleting
						? word.slice(0, t.length - 1)
						: word.slice(0, t.length + 1),
				),
			deleting ? 40 : 75,
		);
		return () => clearTimeout(step);
	}, [text, deleting, index, words, enabled]);

	return text;
}

function relTime(ms: number): string {
	const s = Math.floor((Date.now() - ms) / 1000);
	if (s < 60) return "just now";
	if (s < 3600) return `${Math.floor(s / 60)} min ago`;
	if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
	const d = Math.floor(s / 86400);
	return d === 1 ? "yesterday" : `${d} days ago`;
}

export function HomeExperience({
	popular,
	categories,
	total,
}: {
	popular: DirectoryCentre[];
	categories: CategoryCount[];
	total: number;
}) {
	const router = useRouter();
	const [model, setModel] = useState(DEFAULT_MODEL);
	const [input, setInput] = useState("");
	const [navigating, setNavigating] = useState(false);
	const [recents, setRecents] = useState<RecentChat[]>([]);

	// Returning-visitor sessions (anonymous = this device's localStorage).
	useEffect(() => {
		setRecents(recentChats());
	}, []);

	// The homepage never owns a conversation: mint a session id, stash the first
	// question + model, and navigate to /chat/<id>, where it's consumed on mount.
	function ask(text: string) {
		const trimmed = text.trim();
		if (!trimmed || navigating) return;
		const id = crypto.randomUUID();
		setPending(id, { q: trimmed, model });
		recordRecent(id, trimmed);
		setNavigating(true);
		router.push(`/chat/${id}`);
	}

	const typed = useTypewriter(TYPED, input === "");
	const placeholderOverlay = useMemo(
		() => (
			<span>
				<span className="text-muted-foreground">{typed}</span>
				<span className="text-teal-500 animate-[ds-caret-blink_1s_step-end_infinite]">
					|
				</span>
			</span>
		),
		[typed],
	);

	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<SiteHeader />

			<main className="flex-1">
				{/* Hero */}
				<section
					className="text-center pt-18 px-4 sm:px-6 pb-14"
					style={{
						background:
							"linear-gradient(180deg, var(--teal-tint), var(--bg) 86%)",
					}}
				>
					<div className="max-w-190 mx-auto">
						<span className="inline-flex items-center gap-1.75 px-3.5 py-1.5 text-[13.5px] font-semibold text-teal-700 bg-card border border-teal-200 rounded-full shadow-xs mb-5.5">
							<Icon
								name="shield-check"
								size={14}
							/>
							{total.toLocaleString()} Approved Centres
						</span>
						<h1 className="ds-hero-h1 font-semibold tracking-[-0.03em] leading-[1.05] text-foreground">
							Find the right childcare, faster.
						</h1>
						<p className="text-[19px] leading-normal text-body mt-4.5 mx-auto max-w-145">
							Ask in plain English. Kindello searches every approved
							service in Australia by location, care type and quality
							rating.
						</p>

						<div className="mt-9 mx-auto text-left">
							<ChatComposer
								size="lg"
								value={input}
								onChange={setInput}
								onSubmit={ask}
								disabled={navigating}
								models={COMPOSER_MODELS}
								model={model}
								onModelChange={setModel}
								placeholderOverlay={placeholderOverlay}
							/>
						</div>

						<div className="flex flex-wrap gap-2.25 justify-center mt-5">
							{PROMPT_CHIPS.map((chip) => (
								<PromptChip
									key={chip}
									onClick={() => ask(chip)}
								>
									{chip}
								</PromptChip>
							))}
						</div>
					</div>
				</section>

				{/* Returning visitor — pick up where you left off */}
				{recents.length > 0 && (
					<section className="ds-container py-2">
						<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground mb-4.5 mt-8">
							Pick up where you left off
						</h2>
						<div className="ds-grid ds-grid-3">
							{recents.slice(0, 3).map((c, i) => (
								<ContinueSearchCard
									key={c.id}
									query={c.title}
									when={relTime(c.when)}
									summary="Tap to reopen this conversation"
									pins={[
										[28 + i * 6, 48],
										[54, 38 + i * 4],
										[46, 66],
									]}
									onResume={() => router.push(`/chat/${c.id}`)}
								/>
							))}
						</div>
					</section>
				)}

				<MarketingSections
					popular={popular}
					categories={categories}
				/>
				<SiteFooter />
			</main>
		</div>
	);
}
