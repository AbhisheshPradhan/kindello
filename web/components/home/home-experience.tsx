"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { cn } from "@/lib/utils";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import type { DirectoryCentre, CategoryCount } from "@/lib/directory";
import { SiteHeader } from "@/components/ds/site-header";
import { SiteFooter } from "@/components/ds/site-footer";
import { ChatComposer } from "@/components/ds/chat-composer";
import { PromptChip } from "@/components/ds/prompt-chip";
import { Icon } from "@/components/ds/icon";
import { ContinueSearchCard } from "@/components/ds/continue-search-card";
import { MarketingSections } from "./marketing-sections";
import { ChatView } from "./chat-view";

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

type HistoryItem = { query: string; when: number };
const HISTORY_KEY = "kindello.searchHistory";
const THREAD_KEY = "kindello.thread"; // live conversation, survives back/refresh

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
	const [model, setModel] = useState(DEFAULT_MODEL);
	const [input, setInput] = useState("");
	const [tab, setTab] = useState<"answer" | "places">("answer");
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
	const heroRef = useRef<HTMLDivElement>(null);

	const { messages, sendMessage, setMessages, status, error } = useChat({
		transport: new DefaultChatTransport({ api: "/api/chat" }),
	});
	const busy = status === "submitted" || status === "streaming";
	const isFresh = messages.length === 0;
	const hydrated = useRef(false);

	// Returning-visitor history (anonymous = device localStorage) + restore the
	// live thread from sessionStorage so back/refresh doesn't lose the conversation.
	useEffect(() => {
		try {
			const raw = localStorage.getItem(HISTORY_KEY);
			if (raw) setHistory(JSON.parse(raw));
		} catch {
			/* ignore */
		}
		try {
			const t = sessionStorage.getItem(THREAD_KEY);
			if (t) {
				const parsed = JSON.parse(t) as {
					sessionId: string;
					messages: typeof messages;
				};
				if (parsed.messages?.length) {
					setMessages(parsed.messages);
					if (parsed.sessionId) setSessionId(parsed.sessionId);
				}
			}
		} catch {
			/* ignore */
		}
		hydrated.current = true;
	}, [setMessages]);

	// Persist the thread as it grows (skip the first render before hydration).
	useEffect(() => {
		if (!hydrated.current) return;
		try {
			if (messages.length)
				sessionStorage.setItem(
					THREAD_KEY,
					JSON.stringify({ sessionId, messages }),
				);
			else sessionStorage.removeItem(THREAD_KEY);
		} catch {
			/* ignore */
		}
	}, [messages, sessionId]);

	function pushHistory(query: string) {
		setHistory((prev) => {
			const next = [
				{ query, when: Date.now() },
				...prev.filter((h) => h.query !== query),
			].slice(0, 3);
			try {
				localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
			} catch {
				/* ignore */
			}
			return next;
		});
	}

	function ask(text: string) {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		setInput("");
		setTab("answer");
		pushHistory(trimmed);
		sendMessage({ text: trimmed }, { body: { model, sessionId } });
		// Shallow ?q= for shareable links, without a navigation.
		try {
			const url = new URL(window.location.href);
			url.searchParams.set("q", trimmed);
			window.history.replaceState({}, "", url);
		} catch {
			/* ignore */
		}
	}

	function newSearch() {
		setMessages([]);
		setInput("");
		setTab("answer");
		setSessionId(crypto.randomUUID());
		try {
			const url = new URL(window.location.href);
			url.searchParams.delete("q");
			window.history.replaceState({}, "", url);
		} catch {
			/* ignore */
		}
	}

	const typed = useTypewriter(TYPED, isFresh && input === "");
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
		<div
			// Fresh marketing page scrolls normally; in chat mode the viewport
			// is fixed so the thread scrolls internally and the composer pins.
			className={cn(
				"flex flex-col bg-background",
				isFresh ? "min-h-dvh" : "h-dvh overflow-hidden",
			)}
		>
			<SiteHeader onLogoClick={isFresh ? undefined : () => newSearch()} />

			{isFresh ? (
				<main className="flex-1">
					{/* Hero */}
					<section
						className="text-center pt-18 px-6 pb-14"
						style={{
							background:
								"linear-gradient(180deg, var(--teal-tint), var(--bg) 86%)",
						}}
					>
						<div
							ref={heroRef}
							className="max-w-190 mx-auto"
						>
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
								Ask in plain English. Kindello searches every
								approved service in Australia by location, care
								type and quality rating.
							</p>

							<div className="mt-9 mx-auto text-left">
								<ChatComposer
									size="lg"
									value={input}
									onChange={setInput}
									onSubmit={ask}
									disabled={busy}
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
					{history.length > 0 && (
						<section className="ds-container py-2">
							<h2 className="ds-section-h2 font-semibold tracking-[-0.02em] text-foreground mb-4.5 mt-8">
								Pick up where you left off
							</h2>
							<div className="ds-grid ds-grid-3">
								{history.map((h, i) => (
									<ContinueSearchCard
										key={h.query}
										query={h.query}
										when={relTime(h.when)}
										summary="Tap to run this search again"
										pins={[
											[28 + i * 6, 48],
											[54, 38 + i * 4],
											[46, 66],
										]}
										onResume={() => ask(h.query)}
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
			) : (
				<main className="flex-1 min-h-0 flex">
					<ChatView
						messages={messages}
						busy={busy}
						tab={tab}
						onSelectTab={setTab}
						onNewSearch={newSearch}
						onAsk={ask}
						input={input}
						onInput={setInput}
						models={COMPOSER_MODELS}
						model={model}
						onModelChange={setModel}
						errorText={error?.message}
					/>
				</main>
			)}
		</div>
	);
}
