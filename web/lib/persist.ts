import "server-only";
import type { UIMessage } from "ai";
import { pool } from "./db";

// Upsert the whole transcript for a session. Idempotent: message ids are stable, so
// re-saving each turn just updates rows. Captures tool calls/results via the `parts` JSONB.
export async function saveChat(
	sessionId: string,
	model: string,
	messages: UIMessage[],
) {
	if (!sessionId || messages.length === 0) return;

	const firstUser = messages.find((m) => m.role === "user");
	const title = firstUser ? flatten(firstUser).slice(0, 120) : null;

	await pool.query(
		`INSERT INTO chat_sessions (id, model, title)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET model = EXCLUDED.model, updated_at = now()`,
		[sessionId, model, title],
	);

	for (let i = 0; i < messages.length; i++) {
		const m = messages[i];
		await pool.query(
			`INSERT INTO chat_messages (id, session_id, turn, role, parts, text)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET turn = EXCLUDED.turn, parts = EXCLUDED.parts, text = EXCLUDED.text`,
			[m.id, sessionId, i, m.role, JSON.stringify(m.parts), flatten(m)],
		);
	}
}

function flatten(m: UIMessage): string {
	return m.parts
		.filter((p) => p.type === "text")
		.map((p) => (p as { text: string }).text)
		.join("");
}
