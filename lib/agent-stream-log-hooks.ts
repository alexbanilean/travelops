import { GEMINI_MODEL } from "@/lib/ai-model";
import { createAgentLogger } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";

/** Tool-call shape from streamText (avoid getToolName UI overload in server logs). */
function toolNameFromCall(toolCall: unknown): string {
  if (
    toolCall &&
    typeof toolCall === "object" &&
    "toolName" in toolCall &&
    typeof (toolCall as { toolName: unknown }).toolName === "string"
  ) {
    return (toolCall as { toolName: string }).toolName;
  }
  return "unknown_tool";
}

function toolNamesFromStepEvent(event: {
  toolCalls?: ReadonlyArray<unknown>;
}): string {
  const calls = event.toolCalls;
  if (!calls?.length) return "(none)";
  return calls.map((tc) => toolNameFromCall(tc)).join(", ");
}

export function createPlanningAgentStreamLogHooks(params: {
  eventId: string;
  destination: string;
}) {
  const log = createAgentLogger("planning");

  return {
    experimental_onStart: () => {
      log.info("Planning agent run started", {
        model: GEMINI_MODEL,
        eventId: params.eventId,
        destination: params.destination,
      });
    },

    experimental_onStepStart: (event: {
      stepNumber: number;
      model: unknown;
      steps: { length: number };
    }) => {
      log.info(`LLM request starting (step ${event.stepNumber + 1})`, {
        model: event.model,
        priorStepsCompleted: event.steps.length,
      });
    },

    onStepFinish: (event: {
      stepNumber: number;
      finishReason: string;
      toolCalls?: ReadonlyArray<unknown>;
      usage: unknown;
    }) => {
      log.info(`LLM step ${event.stepNumber + 1} completed`, {
        finishReason: event.finishReason,
        toolCalls: toolNamesFromStepEvent(event),
        usage: event.usage,
      });
    },

    experimental_onToolCallStart: (event: {
      stepNumber?: number;
      toolCall: unknown;
    }) => {
      log.info("Tool execute starting", {
        tool: toolNameFromCall(event.toolCall),
        step: event.stepNumber != null ? event.stepNumber + 1 : undefined,
      });
    },

    experimental_onToolCallFinish: (event: {
      toolCall: unknown;
      success: boolean;
      durationMs: number;
      error?: unknown;
    }) => {
      const tool = toolNameFromCall(event.toolCall);
      if (event.success) {
        log.info("Tool execute finished OK", {
          tool,
          durationMs: event.durationMs,
        });
      } else {
        log.warn("Tool execute failed", {
          tool,
          durationMs: event.durationMs,
          error: formatLlmError(event.error),
        });
      }
    },

    onFinish: (event: {
      finishReason: string;
      steps: { length: number };
      totalUsage: unknown;
    }) => {
      log.info("Planning agent run finished", {
        finishReason: event.finishReason,
        llmSteps: event.steps.length,
        totalUsage: event.totalUsage,
      });
    },

    onError: (event: { error: unknown }) => {
      log.warn("Planning agent stream error", {
        message: formatLlmError(event.error),
      });
    },
  };
}

export function createFinanceAgentStreamLogHooks(params: {
  eventId: string;
  action: string;
  invoiceId?: string;
}) {
  const log = createAgentLogger("finance");

  return {
    experimental_onStart: () => {
      log.info("Finance agent run started", {
        model: GEMINI_MODEL,
        eventId: params.eventId,
        action: params.action,
        invoiceId: params.invoiceId,
      });
    },

    experimental_onStepStart: (event: {
      stepNumber: number;
      model: unknown;
      steps: { length: number };
    }) => {
      log.info(`LLM request starting (step ${event.stepNumber + 1})`, {
        model: event.model,
        priorStepsCompleted: event.steps.length,
      });
    },

    onStepFinish: (event: {
      stepNumber: number;
      finishReason: string;
      toolCalls?: ReadonlyArray<unknown>;
      usage: unknown;
    }) => {
      log.info(`LLM step ${event.stepNumber + 1} completed`, {
        finishReason: event.finishReason,
        toolCalls: toolNamesFromStepEvent(event),
        usage: event.usage,
      });
    },

    experimental_onToolCallStart: (event: {
      stepNumber?: number;
      toolCall: unknown;
    }) => {
      log.info("Tool execute starting", {
        tool: toolNameFromCall(event.toolCall),
        step: event.stepNumber != null ? event.stepNumber + 1 : undefined,
      });
    },

    experimental_onToolCallFinish: (event: {
      toolCall: unknown;
      success: boolean;
      durationMs: number;
      error?: unknown;
    }) => {
      const tool = toolNameFromCall(event.toolCall);
      if (event.success) {
        log.info("Tool execute finished OK", {
          tool,
          durationMs: event.durationMs,
        });
      } else {
        log.warn("Tool execute failed", {
          tool,
          durationMs: event.durationMs,
          error: formatLlmError(event.error),
        });
      }
    },

    onFinish: (event: {
      finishReason: string;
      steps: { length: number };
      totalUsage: unknown;
    }) => {
      log.info("Finance agent run finished", {
        finishReason: event.finishReason,
        llmSteps: event.steps.length,
        totalUsage: event.totalUsage,
      });
    },

    onError: (event: { error: unknown }) => {
      log.warn("Finance agent stream error", {
        message: formatLlmError(event.error),
      });
    },
  };
}
