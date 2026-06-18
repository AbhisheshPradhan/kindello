"use client";

import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { UserBubble } from "@/components/ds/user-bubble";
import { FollowUps } from "@/components/ds/follow-ups";
import { ChatComposer, type ComposerModel } from "@/components/ds/chat-composer";
import { Icon } from "@/components/ds/icon";
import { Markdown } from "@/components/ui/markdown";
import { answerBody, followUpsFor, messageText } from "./parts";

const STARTERS = [
	"Long day care for a 2 year old near Gladesville rated Exceeding",
	"After school care for a 6 year old near Parramatta",
	"Montessori preschool in Surry Hills",
];

export function ConversationRail({
	messages,
	busy,
	onAsk,
	models,
	model,
	onModel,
}: {
	messages: UIMessage[];
	busy: boolean;
	onAsk: (text: string) => void;
	models?: ComposerModel[];
	model?: string;
	onModel?: (id: string) => void;
}) {
	const [input, setInput] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const last = messages[messages.length - 1];
	const followUps = last?.role === "assistant" && !busy ? followUpsFor(last) : [];
	const thinking =
		busy && last?.role === "assistant" && !messageText(last).trim();

	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages, busy]);

	const submit = (t: string) => {
		const trimmed = t.trim();
		if (!trimmed || busy) return;
		setInput("");
		onAsk(trimmed);
	};

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex items-center gap-2 px-4 py-3 border-b border-border">
				<span className="text-teal-500 inline-flex">
					<Icon name="sparkles" size={16} />
				</span>
				<span className="font-semibold text-[14px]">Kindello assistant</span>
			</div>

			<div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-5">
				{messages.length === 0 ? (
					<div className="flex flex-col gap-3 text-[14px] text-muted-foreground">
						<p className="text-body">
							Tell me what you need and I&apos;ll set the filters and map
							out matching centres. For example:
						</p>
						<div className="flex flex-col gap-2">
							{STARTERS.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => submit(s)}
									className="text-left rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] text-body hover:border-teal-300 hover:text-teal-700 transition-colors"
								>
									{s}
								</button>
							))}
						</div>
					</div>
				) : (
					messages.map((m) => {
						if (m.role === "user")
							return <UserBubble key={m.id}>{messageText(m)}</UserBubble>;
						const body = answerBody(m);
						if (!body) return null;
						return (
							<div
								key={m.id}
								className="prose prose-sm dark:prose-invert max-w-none text-[14.5px] leading-relaxed"
							>
								<Markdown>{body}</Markdown>
							</div>
						);
					})
				)}

				{thinking && (
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
						Searching the register…
					</div>
				)}

				{followUps.length > 0 && (
					<FollowUps items={followUps} onSelect={submit} />
				)}
			</div>

			<div className="border-t border-border p-3">
				<ChatComposer
					size="md"
					value={input}
					onChange={setInput}
					onSubmit={submit}
					disabled={busy}
					placeholder="Ask or refine…"
					models={models}
					model={model}
					onModelChange={onModel}
				/>
			</div>
		</div>
	);
}
