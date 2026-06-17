-- Chat logging tables (app-owned, in the same Postgres as the spine).
-- Stores every session + every message INCLUDING tool calls/results (in `parts` JSONB),
-- so we can review conversations, debug the agent, resume old chats, and later build the CRM.
--
-- Apply:  psql -d kindello -f web/db/schema.sql   (idempotent)

CREATE TABLE IF NOT EXISTS chat_sessions (
    id          text PRIMARY KEY,                               -- client-generated session id
    model       text,                                           -- last model used in the session
    title       text,                                           -- optional (e.g. first user message)
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          text PRIMARY KEY,                               -- UIMessage id (stable across turns)
    session_id  text NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
    turn        integer,                                        -- position in the transcript
    role        text NOT NULL,                                  -- user | assistant
    parts       jsonb NOT NULL,                                 -- full UIMessage parts: text + tool-call + tool-result
    text        text,                                           -- flattened text, for quick reading
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, turn);
