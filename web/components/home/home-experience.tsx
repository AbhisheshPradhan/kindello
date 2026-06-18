"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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
				<span style={{ color: "var(--muted-fg)" }}>{typed}</span>
				<span
					style={{
						animation: "ds-caret-blink 1s step-end infinite",
						color: "var(--teal-500)",
					}}
				>
					|
				</span>
			</span>
		),
		[typed],
	);

	return (
		<div
			style={{
				// Fresh marketing page scrolls normally; in chat mode the viewport
				// is fixed so the thread scrolls internally and the composer pins.
				...(isFresh
					? { minHeight: "100dvh" }
					: { height: "100dvh", overflow: "hidden" }),
				display: "flex",
				flexDirection: "column",
				background: "var(--bg)",
			}}
		>
			<SiteHeader onLogoClick={isFresh ? undefined : () => newSearch()} />

			{isFresh ? (
				<main style={{ flex: 1 }}>
					{/* Hero */}
					<section
						style={{
							background:
								"linear-gradient(180deg, var(--teal-tint), var(--bg) 86%)",
							padding: "72px 24px 56px",
							textAlign: "center",
						}}
					>
						<div
							ref={heroRef}
							style={{ maxWidth: 760, margin: "0 auto" }}
						>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 7,
									padding: "6px 14px",
									fontSize: 13.5,
									fontWeight: 600,
									color: "var(--teal-700)",
									background: "var(--surface)",
									border: "1px solid var(--teal-200)",
									borderRadius: "var(--radius-pill)",
									boxShadow: "var(--shadow-xs)",
									marginBottom: 22,
								}}
							>
								<Icon
									name="shield-check"
									size={14}
								/>
								{total.toLocaleString()} Approved Centres
							</span>
							<h1
								className="ds-hero-h1"
								style={{
									fontWeight: 600,
									letterSpacing: "-0.03em",
									lineHeight: 1.05,
									color: "var(--fg)",
								}}
							>
								Find the right childcare, faster.
							</h1>
							<p
								style={{
									fontSize: 19,
									lineHeight: 1.5,
									color: "var(--text-body)",
									margin: "18px auto 0",
									maxWidth: 580,
								}}
							>
								Ask in plain English. Kindello searches every
								approved service in Australia by location, care
								type and quality rating.
							</p>

							<div
								style={{
									margin: "36px auto 0",
									textAlign: "left",
								}}
							>
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

							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: 9,
									justifyContent: "center",
									marginTop: 20,
								}}
							>
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
						<section
							className="ds-container"
							style={{ padding: "8px 24px 8px" }}
						>
							<h2
								className="ds-section-h2"
								style={{
									fontWeight: 600,
									letterSpacing: "-0.02em",
									color: "var(--fg)",
									marginBottom: 18,
									marginTop: 32,
								}}
							>
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
				<main style={{ flex: 1, minHeight: 0, display: "flex" }}>
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
