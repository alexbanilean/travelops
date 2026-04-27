import type { PrepareStepFunction, ToolSet } from "ai";
import { createAgentLogger } from "@/lib/agent-server-log";

/**
 * Free tier for Gemini is often ~5 generateContent requests / minute / model.
 * Each agent *step* (model turn after tool results) is a separate API call, so
 * one "Generate itinerary" click can trigger 6+ calls in a few seconds → 429.
 *
 * Default: wait between steps (after the first) so bursts stay under RPM.
 * Disable: GOOGLE_GENERATIVE_AI_STEP_DELAY_MS=0
 */
export const DEFAULT_GEMINI_STEP_DELAY_MS = 15_000;

export function getGeminiStepDelayMs(): number {
	const raw = process.env.GOOGLE_GENERATIVE_AI_STEP_DELAY_MS;
	if (raw === "0" || raw === "off" || raw === "false") return 0;
	if (raw === undefined || raw === "") return DEFAULT_GEMINI_STEP_DELAY_MS;
	const n = Number.parseInt(raw, 10);
	return Number.isFinite(n) && n >= 0 ? n : DEFAULT_GEMINI_STEP_DELAY_MS;
}

/**
 * AI SDK defaults maxRetries to 2. On 429, each retry counts as another request
 * and burns the same tight RPM quota — disable retries on free tier.
 * Override: GOOGLE_GENERATIVE_AI_MAX_RETRIES=2
 */
export function getGeminiMaxRetries(): number {
	const raw = process.env.GOOGLE_GENERATIVE_AI_MAX_RETRIES;
	if (raw === undefined || raw === "") return 0;
	const n = Number.parseInt(raw, 10);
	return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Throttle multi-step agent loops so Google RPM limits are not exceeded. */
export function createGeminiPrepareStep<
	T extends ToolSet,
>(): PrepareStepFunction<T> {
	const log = createAgentLogger("gemini-rate-limit");
	return async ({ steps }) => {
		const ms = getGeminiStepDelayMs();
		if (ms > 0 && steps.length > 0) {
			log.info(`Inter-step throttle: sleeping ${ms}ms before next LLM call`, {
				completedSteps: steps.length,
			});
			await new Promise((resolve) => setTimeout(resolve, ms));
			log.info("Inter-step throttle: sleep done, proceeding to next LLM call");
		}
		return {};
	};
}
