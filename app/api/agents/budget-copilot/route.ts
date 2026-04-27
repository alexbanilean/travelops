import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildEventAssistantMessages,
  createEventAssistantStream,
} from "@/lib/agents/event-assistant-agent";
import { createAgentLogger } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";
import { toAgentPlainTextStreamResponse } from "@/lib/to-agent-plain-text-stream-response";
import { getActorFromRequest } from "@/lib/actor-request";

const BodySchema = z.object({
  eventId: z.string().min(1),
  message: z.string().min(1).max(8000),
});

/** @deprecated Use POST /api/agents/event-assistant — kept for older clients. */
export async function POST(req: NextRequest) {
  const routeLog = createAgentLogger("budget-copilot-api");
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const actor = getActorFromRequest(req);
    routeLog.info("POST budget-copilot (proxied)", { eventId: parsed.data.eventId });
    const messages = await buildEventAssistantMessages({
      eventId: parsed.data.eventId,
      surface: "event-budget",
      history: [{ role: "user", content: parsed.data.message }],
    });
    const stream = createEventAssistantStream({
      eventId: parsed.data.eventId,
      surface: "event-budget",
      messages,
      actorName: actor,
    });
    return toAgentPlainTextStreamResponse(stream, "budget-copilot-stream");
  } catch (error) {
    routeLog.warn("budget-copilot failed", { message: formatLlmError(error) });
    return NextResponse.json(
      { error: formatLlmError(error) },
      { status: 500 }
    );
  }
}
