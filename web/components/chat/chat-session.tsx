"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import { SiteHeader } from "@/components/ds/site-header";
import { ChatView } from "@/components/home/chat-view";
import {
	loadThread,
	saveThread,
	recordRecent,
	takePending,
} from "@/lib/chat-storage";

const COMPOSER_MODELS = MODELS.map((m) => ({ id: m.id, label: m.label }));

function textOf(m: UIMessage): string {
	return m.parts
		.filter((p) => p.type === "text")
		.map((p) => (p as { text: string }).text)
		.join("")
		.trim();
}

// One conversation, owned entirely by its /chat/<id> route. The homepage composer
// never owns a chat — it mints the id, stashes the first question, and navigates
// here, where we consume the pending question on mount.
export function ChatSession({
	id,
	initialMessages = [],
}: {
	id: string;
	// Empty for anon (Stage 1, hydrated from localStorage). Later, the server
	// shell fills this from Postgres for logged-in users (Stage 2).
	initialMessages?: UIMessage[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [model, setModel] = useState(DEFAULT_MODEL);
	const [input, setInput] = useState("");
	// Tab lives in the URL (?tab=places) so it's deep-linkable/shareable; local
	// state mirrors it for instant switching without a navigation round-trip.
	const [tab, setTabState] = useState<"answer" | "places">(
		searchParams.get("tab") === "places" ? "places" : "answer",
	);

	function setTab(t: "answer" | "places") {
		setTabState(t);
		// Update the URL via the History API rather than router.replace: the tab is
		// already mirrored in local state, so all we want is a deep-linkable URL —
		// router.replace would re-fetch the RSC payload on every toggle (a GET
		// /chat/<id>?tab=… round-trip) for no benefit. Next syncs this into
		// useSearchParams, so it stays shareable without the server hit.
		const params = new URLSearchParams(searchParams.toString());
		if (t === "answer") params.delete("tab");
		else params.set("tab", t);
		const qs = params.toString();
		window.history.replaceState(
			null,
			"",
			qs ? `${pathname}?${qs}` : pathname,
		);
	}

	const { messages, sendMessage, setMessages, status, error } = useChat({
		transport: new DefaultChatTransport({ api: "/api/chat" }),
	});
	const busy = status === "submitted" || status === "streaming";
	const hydrated = useRef(false);

	// Hydrate this session once: DB-provided messages win (logged-in, later),
	// otherwise the anon thread from localStorage; then fire any pending first
	// question handed off by the homepage composer.
	useEffect(() => {
		if (hydrated.current) return;
		hydrated.current = true;

		if (initialMessages.length) {
			setMessages(initialMessages);
		} else {
			const stored = loadThread(id);
			if (stored?.messages?.length) {
				setMessages(stored.messages);
				if (stored.model) setModel(stored.model);
			}
		}

		const pending = takePending(id);
		if (pending) {
			const m = pending.model || DEFAULT_MODEL;
			setModel(m);
			recordRecent(id, pending.q);
			sendMessage(
				{ text: pending.q },
				{ body: { model: m, sessionId: id } },
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Persist the anon thread + recent index as it grows (Stage 1).
	useEffect(() => {
		if (!hydrated.current || !messages.length) return;
		saveThread(id, model, messages);
		const firstUser = messages.find((m) => m.role === "user");
		if (firstUser) {
			const title = textOf(firstUser);
			if (title) recordRecent(id, title);
		}
	}, [messages, model, id]);

	function ask(text: string) {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		setInput("");
		setTab("answer");
		sendMessage({ text: trimmed }, { body: { model, sessionId: id } });
	}

	function newSearch() {
		router.push("/");
	}

	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<SiteHeader onLogoClick={newSearch} />
			<main className="flex-1">
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
		</div>
	);
}
