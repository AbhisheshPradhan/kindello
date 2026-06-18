// Client-side chat persistence for ANONYMOUS users (Stage 1).
//
// Source of truth for an anon visitor's transcripts is this device's localStorage;
// the server still writes every transcript to Postgres (see lib/persist.ts), but we
// don't read those back until accounts exist (Stage 2: logged-in users load their
// sessions from the DB by user_id). All access is guarded for SSR + quota errors.
//
//   kindello.thread.<id>  -> the full transcript for one /chat/<id> session
//   kindello.chats        -> a small index of recent sessions, for the homepage
//                            "pick up where you left off" cards
//   kindello.pending.<id> -> the first question handed off by the homepage composer
//                            when it navigates to a brand-new /chat/<id>

import type { UIMessage } from "ai";

const RECENT_KEY = "kindello.chats";
const RECENT_MAX = 6;

const threadKey = (id: string) => `kindello.thread.${id}`;
const pendingKey = (id: string) => `kindello.pending.${id}`;

export type StoredThread = {
	sessionId: string;
	model: string;
	messages: UIMessage[];
};

export type RecentChat = { id: string; title: string; when: number };

export type Pending = { q: string; model: string };

function ls(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
}

export function loadThread(id: string): StoredThread | null {
	const store = ls();
	if (!store) return null;
	try {
		const raw = store.getItem(threadKey(id));
		return raw ? (JSON.parse(raw) as StoredThread) : null;
	} catch {
		return null;
	}
}

export function saveThread(
	id: string,
	model: string,
	messages: UIMessage[],
): void {
	const store = ls();
	if (!store) return;
	try {
		store.setItem(
			threadKey(id),
			JSON.stringify({ sessionId: id, model, messages } as StoredThread),
		);
	} catch {
		/* quota / private mode — non-fatal */
	}
}

export function recentChats(): RecentChat[] {
	const store = ls();
	if (!store) return [];
	try {
		const raw = store.getItem(RECENT_KEY);
		return raw ? (JSON.parse(raw) as RecentChat[]) : [];
	} catch {
		return [];
	}
}

// Upsert a session into the recent index (newest first, deduped by id).
export function recordRecent(id: string, title: string): void {
	const store = ls();
	if (!store) return;
	try {
		const next = [
			{ id, title, when: Date.now() },
			...recentChats().filter((c) => c.id !== id),
		].slice(0, RECENT_MAX);
		store.setItem(RECENT_KEY, JSON.stringify(next));
	} catch {
		/* non-fatal */
	}
}

export function setPending(id: string, pending: Pending): void {
	const store = ls();
	if (!store) return;
	try {
		store.setItem(pendingKey(id), JSON.stringify(pending));
	} catch {
		/* non-fatal */
	}
}

// Read-and-clear the homepage handoff question for a new session.
export function takePending(id: string): Pending | null {
	const store = ls();
	if (!store) return null;
	try {
		const raw = store.getItem(pendingKey(id));
		if (!raw) return null;
		store.removeItem(pendingKey(id));
		return JSON.parse(raw) as Pending;
	} catch {
		return null;
	}
}
