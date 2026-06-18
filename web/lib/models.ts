// Client-safe model registry (data only — no provider SDK imports, so it's safe to import
// into client components for the dropdown). The server-side resolver lives in provider.ts.

export type Provider = "anthropic" | "openai" | "google";
export type ModelInfo = { id: string; label: string; provider: Provider };

// Add/remove freely — each just needs that provider's key in .env.local.
// Gemini is intentionally omitted: there's no GOOGLE_GENERATIVE_AI_API_KEY set,
// so those options would only error. Re-add the google entries once a key exists.
export const MODELS: ModelInfo[] = [
	{ id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
	{ id: "gpt-4o", label: "GPT-4o", provider: "openai" },
	{
		id: "claude-haiku-4-5",
		label: "Claude Haiku 4.5 (fast/cheap)",
		provider: "anthropic",
	},
	{
		id: "claude-sonnet-4-6",
		label: "Claude Sonnet 4.6",
		provider: "anthropic",
	},
	{
		id: "claude-opus-4-8",
		label: "Claude Opus 4.8 (most capable)",
		provider: "anthropic",
	},
];

// gpt-4o-mini is the working default today (the Anthropic account is out of
// credits). Flip to a claude-* id here once credits + the env key are sorted.
export const DEFAULT_MODEL = "gpt-4o-mini";
