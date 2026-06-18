"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Sparkles } from "lucide-react";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import {
	ChatContainerContent,
	ChatContainerRoot,
} from "@/components/ui/chat-container";
import { Message, MessageContent } from "@/components/ui/message";
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CentreResults, type Centre } from "@/components/centre-card";

const SUGGESTIONS = [
	"Long day care for a 2-year-old near Gladesville, rated Exceeding",
	"After-school care for a 6-year-old near Parramatta",
	"Kindergarten for a 4-year-old around postcode 2026",
	"Before-school care close to Surry Hills",
];

const PLACEHOLDER_PREFIX = "Find a childcare centre near ";
const SUBURBS = [
	"Bondi",
	"Parramatta",
	"Carlton",
	"Surry Hills",
	"Fremantle",
	"South Brisbane",
	"Newtown",
];

// Typewriter that types a word, holds, deletes, then rotates to the next.
function useTypewriter(words: string[], enabled: boolean) {
	const [index, setIndex] = useState(0);
	const [text, setText] = useState("");
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!enabled) return;
		const word = words[index % words.length];

		if (!deleting && text === word) {
			const hold = setTimeout(() => setDeleting(true), 1600);
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
			deleting ? 45 : 80,
		);
		return () => clearTimeout(step);
	}, [text, deleting, index, words, enabled]);

	return text;
}

export default function Home() {
	const [model, setModel] = useState(DEFAULT_MODEL);
	const [input, setInput] = useState("");
	// One session id per page load (new chat on refresh — fine for now; it's the key we log under).
	const [sessionId] = useState(() => crypto.randomUUID());
	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({ api: "/api/chat" }),
	});
	const busy = status === "submitted" || status === "streaming";
	const isFresh = messages.length === 0;

	// Show the "thinking" loader only until the assistant's reply text starts arriving
	// (i.e. while resolving/searching) — once text streams, the message itself is the feedback.
	const lastMsg = messages[messages.length - 1];
	const lastAssistantText =
		lastMsg?.role === "assistant"
			? lastMsg.parts
					.filter((p) => p.type === "text")
					.map((p) => (p as { text: string }).text)
					.join("")
			: "";
	const showThinking = busy && !lastAssistantText;

	// Animate the suburb placeholder only on a fresh session (and while empty). Once a
	// chat is underway, drop the animation for a plain prompt.
	const typed = useTypewriter(SUBURBS, isFresh && input === "");
	const placeholder = isFresh
		? PLACEHOLDER_PREFIX + typed
		: "Write a message…";

	function send(text = input) {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		setInput("");
		sendMessage({ text: trimmed }, { body: { model, sessionId } });
	}

	const composer = (
		<PromptInput
			value={input}
			onValueChange={setInput}
			isLoading={busy}
			onSubmit={() => send()}
			className="border-border bg-card shadow-lg"
		>
			<PromptInputTextarea
				placeholder={placeholder}
				className="text-foreground"
			/>
			<PromptInputActions className="justify-end gap-2 pt-2">
				<label
					htmlFor="model"
					className="sr-only"
				>
					Model
				</label>
				<select
					id="model"
					value={model}
					onChange={(e) => setModel(e.target.value)}
					// PromptInput's root refocuses the textarea on click; stop bubbling so the
					// native dropdown isn't slammed shut by that focus-steal.
					onMouseDown={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
					className="cursor-pointer rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
				>
					{MODELS.map((m) => (
						<option
							key={m.id}
							value={m.id}
						>
							{m.label}
						</option>
					))}
				</select>
				<PromptInputAction tooltip="Send">
					<Button
						size="icon"
						onClick={() => send()}
						disabled={busy || !input.trim()}
						className="size-9 rounded-full"
						aria-label="Send"
					>
						<ArrowUp className="size-5" />
					</Button>
				</PromptInputAction>
			</PromptInputActions>
		</PromptInput>
	);

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<header className="z-10 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3 backdrop-blur-md">
				<div className="flex items-center gap-2">
					<span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<Sparkles className="size-4" />
					</span>
					<h1 className="text-lg font-semibold tracking-tight">
						Kindello
					</h1>
				</div>
				<div className="flex-1" />
				<ThemeToggle />
			</header>

			{isFresh ? (
				// Fresh session: hero + composer centered in the page (ChatGPT/Claude style).
				<main className="flex flex-1 flex-col items-center justify-center px-4">
					<div className="w-full max-w-2xl text-center">
						<h2 className="text-3xl font-semibold tracking-tight">
							Find approved childcare, anywhere in Australia
						</h2>
						<p className="mt-3 text-muted-foreground">
							Ask in plain English. I&rsquo;ll search by
							location, care type, and quality rating.
						</p>
						<div className="mt-8">{composer}</div>
						<div className="mt-5 flex flex-wrap items-center justify-center gap-2">
							{SUGGESTIONS.map((s) => (
								<PromptSuggestion
									key={s}
									onClick={() => send(s)}
								>
									{s}
								</PromptSuggestion>
							))}
						</div>
					</div>
				</main>
			) : (
				<>
					<ChatContainerRoot className="relative flex-1">
						<ChatContainerContent className="mx-auto w-full max-w-3xl px-4 py-6">
							{messages.map((m, i) => {
								const text = m.parts
									.filter((p) => p.type === "text")
									.map((p) => (p as { text: string }).text)
									.join("");
								// While this (last) message is still streaming, hold the cards back
								// until the intro text has come in — so the message loads first,
								// then the results stream in after.
								const streamingThis =
									i === messages.length - 1 && busy;
								// Render searchCentres tool output as cards (ignore the {error} object form).
								const centres = m.parts
									.filter(
										(p) =>
											p.type === "tool-searchCentres" &&
											(p as { state?: string }).state ===
												"output-available",
									)
									.map(
										(p) =>
											(p as { output?: unknown }).output,
									)
									.filter((out): out is Centre[] =>
										Array.isArray(out),
									)
									.flat();
								const isUser = m.role === "user";

								if (isUser) {
									return (
										<div
											key={m.id}
											className="flex justify-end py-2"
										>
											<MessageContent className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground prose-invert">
												{text}
											</MessageContent>
										</div>
									);
								}

								return (
									<Message
										key={m.id}
										className="justify-start py-2"
									>
										<div className="flex w-full flex-col gap-1">
											{text && (
												<MessageContent
													markdown
													className="bg-card text-card-foreground prose-sm rounded-2xl border border-border px-4 py-2.5 shadow-sm prose-strong:text-inherit prose-headings:text-inherit prose-a:text-primary prose-a:underline"
												>
													{text}
												</MessageContent>
											)}
											{centres.length > 0 &&
												!streamingThis && (
													<CentreResults
														centres={centres}
													/>
												)}
										</div>
									</Message>
								);
							})}

							{showThinking && (
								<div className="flex justify-start py-2">
									<div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
										<Loader variant="typing" />
									</div>
								</div>
							)}

							{status === "error" && (
								<div className="py-2 text-sm text-destructive">
									Something went wrong. Check that the
									selected model&rsquo;s API key is set in{" "}
									<code className="mx-1">.env.local</code> and
									the dev server was restarted.
								</div>
							)}
						</ChatContainerContent>

						<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
							<ScrollButton />
						</div>
					</ChatContainerRoot>

					<div className="bg-background px-4 pb-4">
						<div className="mx-auto w-full max-w-3xl">
							{composer}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
