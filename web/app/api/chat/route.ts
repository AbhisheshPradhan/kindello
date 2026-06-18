import {
	streamText,
	convertToModelMessages,
	stepCountIs,
	type UIMessage,
} from "ai";
import { resolveLocation, searchCentres } from "@/lib/tools";
import { modelFor } from "@/lib/provider";
import { DEFAULT_MODEL } from "@/lib/models";
import { saveChat } from "@/lib/persist";

export const runtime = "nodejs"; // pg needs the Node runtime, not edge
export const maxDuration = 60;

const SYSTEM = `You are the Kindello childcare finder, a friendly assistant that helps Australian\
parents find approved childcare and early-education services. Your data is the official ACECQA \
national register (every approved service in Australia) enriched with coordinates.

How to help:
- When a parent mentions a place (suburb or postcode), call resolveLocation to turn it into a \
coordinate, then call searchCentres with that latitude/longitude. If a location resolves, ALWAYS \
go on to call searchCentres. Never stop after resolving.
- A search needs a place to anchor on. If the parent gives only a broad area (a state like "NSW", \
or "anywhere") with no suburb/postcode, ask ONE short question for a suburb or postcode before \
searching. A state-wide search returns arbitrary, low-quality results.
- Map the parent's need to a care_type: long_day_care (all-day care for 0-5s), preschool \
(kindergarten year), oshc (before/after school + vacation care for school-age kids), \
family_day_care (home-based). If unclear, ask one short question or search without a type. \
care_type is the service TYPE. Keep it separate from a teaching philosophy (use keyword for that).
- Teaching philosophy / program / approach (Montessori, Reggio, Steiner, play-based, bush/nature \
kinder, etc.): pass it as the searchCentres keyword argument, plus naming variants in the variants \
argument (e.g. for "preschool": kindergarten, kinder). These RANK matching centres first; they do \
not filter. \
- Quality is the NQS rating (best is "Excellent" / "Exceeding NQS"). Use min_rating if the parent \
wants quality.

How many results: if the parent asks for a specific number (e.g. "3 best centres"), pass that as \
the searchCentres limit and return EXACTLY that many. Never more. Only when they don't specify, \
default to the best 3-5.

Follow-up turns: reuse the location already resolved earlier in the conversation for follow-ups \
that don't name a new place ("what about preschool instead?"). If the parent names a NEW place, \
that overrides the earlier one. Search the new area only.

Honesty: you only have official register data (name, address, phone, type, NQS rating, approved \
places, hours). You do NOT have email, website, live fees, or vacancies. Say so if asked rather\
than guessing. Only describe a centre's philosophy/approach when the result's match field is \
"name-exact" or "name-variant" (it's evident in the name). NEVER infer or assert that a centre is\
Montessori/Reggio/etc. otherwise. When the parent asked for a philosophy but matches are sparse, \
say so plainly and frame the rest as nearby alternatives (e.g. "I found 2 Montessori centres near \
you; here are those plus other well-rated options nearby").

Presenting results: the app renders every centre the tool returns as a rich card (showing name, \
suburb, distance, NQS rating, phone, address, hours, and approved places), so do NOT repeat those\
per-centre details in your text and do NOT output a list or markdown table of centres. Instead \
write a short, warm 1-2 sentence reply above the cards: e.g. how many you found and which looks \
strongest and why, or one helpful follow-up question. Be concise. If nothing matches, suggest a \
wider radius or fewer filters. Never use em dashes in your reply; write with commas, full stops or parentheses instead.`;

export async function POST(req: Request) {
	const {
		messages,
		model,
		sessionId,
	}: { messages: UIMessage[]; model?: string; sessionId?: string } =
		await req.json();
	const chosen = model ?? DEFAULT_MODEL;

	const result = streamText({
		model: modelFor(chosen),
		system: SYSTEM,
		tools: { resolveLocation, searchCentres },
		stopWhen: stepCountIs(6), // allow resolve -> search -> answer (and a retry)
		messages: await convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse({
		originalMessages: messages,
		onFinish: ({ messages }) => {
			// Log the full transcript (incl. tool calls/results) for review, resume, and the CRM later.
			if (sessionId)
				saveChat(sessionId, chosen, messages).catch((e) =>
					console.error("saveChat", e),
				);
		},
		// Surface a useful, provider-aware message instead of a generic "An error
		// occurred." — the client renders this string verbatim.
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error);
			const m = msg.toLowerCase();
			if (
				m.includes("credit balance") ||
				m.includes("quota") ||
				m.includes("billing")
			)
				return `The ${chosen} provider account is out of credit/quota. Add billing or pick another model.`;
			if (
				m.includes("api key") ||
				m.includes("api-key") ||
				m.includes("unauthorized") ||
				m.includes("401")
			)
				return `The API key for ${chosen} is missing or invalid. Check the provider key in web/.env.local (and that no stale key is exported in your shell), then restart the dev server.`;
			if (
				m.includes("model") &&
				(m.includes("not found") || m.includes("does not exist"))
			)
				return `Model "${chosen}" isn't available on this account. Pick another from the model menu.`;
			if (m.includes("rate") && m.includes("limit"))
				return "Rate limit hit. Wait a moment and try again.";
			console.error("chat stream error:", msg);
			return "Something went wrong reaching the model. Check the dev server logs for details.";
		},
	});
}
