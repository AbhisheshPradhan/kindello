import { ChatSession } from "@/components/chat/chat-session";

// Server shell for one conversation. For anon visitors this just hands the id to
// the client, which hydrates the transcript from localStorage. The seam for
// Stage 2 (logged-in): load the transcript from Postgres by id here and pass it
// as `initialMessages` — the client component already accepts it, no churn.
export default async function ChatPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <ChatSession id={id} />;
}
