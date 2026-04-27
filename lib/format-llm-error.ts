/**
 * Short, user-facing message for API / model failures (no stack traces).
 */
export function formatLlmError(error: unknown): string {
  if (error == null) return "Something went wrong. Please try again.";
  if (typeof error === "string") return truncateOneLine(error);
  if (error instanceof Error) return truncateOneLine(error.message);
  if (typeof error === "object" && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string") return truncateOneLine(m);
  }
  return "The AI service returned an error. Please try again later.";
}

function truncateOneLine(message: string): string {
  const line = message.split("\n")[0]?.trim() || message;
  if (line.length > 720) return `${line.slice(0, 720)}…`;
  return line;
}
