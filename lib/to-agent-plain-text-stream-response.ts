import type { StreamTextResult, ToolSet } from "ai";
import { AGENT_STREAM_ERROR_MARKER } from "@/lib/agent-stream-protocol";
import { createAgentLogger, type AgentLogScope } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";

const STREAM_NOISE_TYPES = new Set<string>([
  "text-delta",
  "text-start",
  "text-end",
  "reasoning-delta",
  "reasoning-start",
  "reasoning-end",
  "tool-input-start",
  "tool-input-delta",
  "tool-input-end",
  "raw",
  "start-step",
  "finish-step",
]);

/**
 * Streams model text to the client and appends a marked error block if the
 * run fails (quota, network, tool errors, etc.).
 */
export function toAgentPlainTextStreamResponse<TOOLS extends ToolSet>(
  // Second type parameter is SDK-internal output mode; callers use inferred tools.
  result: StreamTextResult<TOOLS, never>,
  streamLog?: AgentLogScope
): Response {
  const encoder = new TextEncoder();
  let errorWritten = false;
  const slog =
    streamLog === "planning-stream" || streamLog === "finance-stream"
      ? createAgentLogger(streamLog)
      : null;

  const writeError = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    err: unknown
  ) => {
    if (errorWritten) return;
    errorWritten = true;
    controller.enqueue(
      encoder.encode(`${AGENT_STREAM_ERROR_MARKER}${formatLlmError(err)}`)
    );
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      slog?.info("Response stream open (client will receive text chunks)");
      try {
        for await (const part of result.fullStream) {
          if (
            slog &&
            !STREAM_NOISE_TYPES.has(part.type)
          ) {
            if (part.type === "tool-call") {
              const name =
                "toolName" in part && part.toolName != null
                  ? String(part.toolName)
                  : "tool";
              slog.info("Downstream stream part", { type: part.type, tool: name });
            } else if (part.type === "error") {
              slog.warn("Downstream stream part", {
                type: part.type,
                message: formatLlmError(part.error),
              });
            } else if (part.type === "tool-error") {
              slog.warn("Downstream stream part", {
                type: part.type,
                message: formatLlmError(
                  "error" in part && part.error != null ? part.error : part
                ),
              });
            } else {
              slog.info("Downstream stream part", { type: part.type });
            }
          }

          if (part.type === "text-delta" && part.text) {
            controller.enqueue(encoder.encode(part.text));
          } else if (part.type === "tool-call") {
            const name =
              "toolName" in part && part.toolName != null
                ? String(part.toolName)
                : "tool";
            controller.enqueue(encoder.encode(`\n[Tool] ${name}\n`));
          } else if (part.type === "tool-error") {
            const err =
              "error" in part && part.error != null ? part.error : part;
            writeError(controller, err);
          } else if (part.type === "error") {
            writeError(controller, part.error);
          } else if (part.type === "abort") {
            writeError(
              controller,
              new Error(part.reason?.trim() || "Generation was cancelled.")
            );
          } else if (part.type === "finish" && part.finishReason === "error") {
            writeError(
              controller,
              new Error("The model finished with an error.")
            );
          }
        }
      } catch (err) {
        writeError(controller, err);
      } finally {
        slog?.info("Response stream closed", {
          sentErrorMarker: errorWritten,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-TravelOps-Agent-Stream": "1",
    },
  });
}
