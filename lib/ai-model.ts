/**
 * Gemini model id for @ai-sdk/google.
 *
 * If you see 429 with "free_tier_requests, limit: 0" for `gemini-2.0-flash`, Google has
 * often disabled or zeroed that model's free quota for new keys / regions. Set
 * `GOOGLE_GENERATIVE_AI_MODEL` in `.env.local` to a model your project can use, e.g.:
 *   - gemini-2.5-flash
 *   - gemini-2.0-flash  (separate daily/RPM quota bucket from 2.5)
 *   - gemini-1.5-flash
 *   - gemini-1.5-flash-8b
 *
 * If you hit **GenerateRequestsPerDayPerProjectPerModel** (e.g. limit 20/day for one model),
 * switching to another model id above usually gives you a fresh per-model daily allowance.
 *
 * Also confirm the Generative Language API is enabled for your Google Cloud project
 * linked to the API key (Google AI Studio → API key → project).
 */
export const GEMINI_MODEL =
  process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || "gemini-2.5-flash";
