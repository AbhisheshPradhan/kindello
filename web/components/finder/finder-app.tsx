"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SiteHeader } from "@/components/ds/site-header";
import { CriteriaBar } from "@/components/ds/criteria-bar";
import { Icon } from "@/components/ds/icon";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import {
	applyDelta,
	canSearch,
	defaultSearchState,
	type SearchState,
} from "@/lib/search-state";
import type { SearchResult } from "@/lib/search-core";
import { ResultsCanvas } from "./results-canvas";
import { ConversationRail } from "./conversation-rail";
import { deltaFromAssistant } from "./parts";

const COMPOSER_MODELS = MODELS.map((m) => ({ id: m.id, label: m.label }));

export function FinderApp() {
	const [state, setState] = useState<SearchState>(defaultSearchState);
	const [result, setResult] = useState<SearchResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [resolving, setResolving] = useState(false);
	const [view, setView] = useState<"map" | "list">("map");
	const [model, setModel] = useState(DEFAULT_MODEL);
	const [railOpen, setRailOpen] = useState(false); // mobile drawer
	const sessionId = useRef<string>("");
	if (!sessionId.current) sessionId.current =
		typeof crypto !== "undefined" && crypto.randomUUID
			? crypto.randomUUID()
			: String(Math.random());

	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({ api: "/api/chat" }),
	});
	const busy = status === "submitted" || status === "streaming";

	// The one deterministic search the canvas always reflects. Both the filter chips and
	// the AI (after it changes filters) funnel through here, so chat + filters never drift.
	const runDeterministic = useCallback(async (next: SearchState) => {
		if (!canSearch(next)) {
			setResult(null);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ state: next }),
			});
			const data = (await res.json()) as SearchResult | { error: string };
			setResult("error" in data ? null : data);
		} catch {
			setResult(null);
		} finally {
			setLoading(false);
		}
	}, []);

	// Filter chip / widen edits: apply the delta and re-run deterministically.
	const onChange = useCallback(
		(delta: Partial<SearchState>) => {
			setState((prev) => {
				const next = applyDelta(prev, delta);
				void runDeterministic(next);
				return next;
			});
		},
		[runDeterministic],
	);

	// Filter-first location entry (typed into the location chip).
	const onResolve = useCallback(
		async (text: string) => {
			setResolving(true);
			try {
				const res = await fetch("/api/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ resolve: text }),
				});
				const loc = (await res.json()) as {
					lat?: number;
					lng?: number;
					label?: string;
					error?: string;
				};
				if (typeof loc.lat === "number" && typeof loc.lng === "number") {
					onChange({
						location: { lat: loc.lat, lng: loc.lng, label: loc.label ?? text },
					});
				}
			} finally {
				setResolving(false);
			}
		},
		[onChange],
	);

	const onAsk = useCallback(
		(text: string) => {
			setRailOpen(true);
			sendMessage(
				{ text },
				{
					body: {
						model,
						sessionId: sessionId.current,
						searchState: state.location ? state : undefined,
					},
				},
			);
		},
		[sendMessage, model, state],
	);

	// Land on results immediately: run the default (Sydney) search once on mount.
	const didInit = useRef(false);
	useEffect(() => {
		if (didInit.current) return;
		didInit.current = true;
		if (canSearch(state)) void runDeterministic(state);
	}, [state, runDeterministic]);

	// Mirror the AI's actions into the canonical state, then refresh the canvas. Guarded by
	// the message id so a completed turn is only synced once.
	const syncedId = useRef<string | null>(null);
	useEffect(() => {
		if (busy) return;
		const last = messages[messages.length - 1];
		if (!last || last.role !== "assistant" || last.id === syncedId.current)
			return;
		syncedId.current = last.id;
		const delta = deltaFromAssistant(last);
		if (delta) {
			setState((prev) => {
				const next = applyDelta(prev, delta);
				void runDeterministic(next);
				return next;
			});
		}
	}, [messages, busy, runDeterministic]);

	return (
		<div className="flex flex-col h-dvh bg-background">
			<SiteHeader />
			<div className="flex flex-1 min-h-0">
				{/* AI rail — desktop: fixed left column. */}
				<aside className="hidden md:flex md:w-95 lg:w-105 flex-none border-r border-border">
					<ConversationRail
						messages={messages}
						busy={busy}
						onAsk={onAsk}
						models={COMPOSER_MODELS}
						model={model}
						onModel={setModel}
					/>
				</aside>

				{/* Results canvas — the directory meat. */}
				<main className="flex-1 min-h-0 flex flex-col">
					<div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4">
						<CriteriaBar
							state={state}
							facets={result?.facets}
							resolving={resolving}
							onChange={onChange}
							onResolve={onResolve}
						/>
					</div>
					<div className="flex-1 min-h-0 flex flex-col px-4 py-4">
						<ResultsCanvas
							result={result}
							loading={loading}
							view={view}
							onView={setView}
							state={state}
							onChange={onChange}
						/>
					</div>
				</main>
			</div>

			{/* Mobile: floating Ask button + full-screen rail drawer. */}
			<button
				type="button"
				onClick={() => setRailOpen(true)}
				className="md:hidden fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-teal-500 text-white shadow-lg px-4 py-3 text-[14px] font-semibold"
			>
				<Icon name="sparkles" size={16} />
				Ask
			</button>
			{railOpen && (
				<div className="md:hidden fixed inset-0 z-40 flex flex-col bg-background">
					<div className="flex items-center justify-between px-4 py-3 border-b border-border">
						<span className="font-semibold text-[14px]">Assistant</span>
						<button
							type="button"
							aria-label="Close"
							onClick={() => setRailOpen(false)}
							className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary"
						>
							<Icon name="x" size={18} />
						</button>
					</div>
					<div className="flex-1 min-h-0">
						<ConversationRail
							messages={messages}
							busy={busy}
							onAsk={onAsk}
							models={COMPOSER_MODELS}
							model={model}
							onModel={setModel}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
