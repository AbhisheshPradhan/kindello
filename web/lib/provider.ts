import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { MODELS, DEFAULT_MODEL } from "./models";

// Server-only: maps a model id to the right provider client. Imports the provider SDKs,
// so this must never be pulled into a client bundle (hence "server-only").
export function modelFor(id: string): LanguageModel {
	const info =
		MODELS.find((m) => m.id === id) ??
		MODELS.find((m) => m.id === DEFAULT_MODEL)!;
	switch (info.provider) {
		case "anthropic":
			return anthropic(info.id);
		case "openai":
			return openai(info.id);
		case "google":
			return google(info.id);
	}
}
