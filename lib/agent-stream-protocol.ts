/**
 * Plain-text agent streams encode terminal failures after this marker so the
 * client can show errors even when HTTP status is 200 (streaming already started).
 * (AI SDK `toTextStreamResponse` ignores non-text stream parts, including errors.)
 */
export const AGENT_STREAM_ERROR_MARKER = "\n\n<<<TRAVEL_OPS_STREAM_ERROR>>>\n";

export function splitAgentStreamPayload(full: string): {
  displayText: string;
  streamError?: string;
} {
  const i = full.indexOf(AGENT_STREAM_ERROR_MARKER);
  if (i === -1) return { displayText: full };
  return {
    displayText: full.slice(0, i),
    streamError:
      full.slice(i + AGENT_STREAM_ERROR_MARKER.length).trim() ||
      "Generation failed.",
  };
}
