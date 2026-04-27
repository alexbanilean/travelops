import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildEventAssistantMessages,
  createEventAssistantStream,
  type EventAssistantSurface,
} from "@/lib/agents/event-assistant-agent";
import { createAgentLogger } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";
import { toAgentPlainTextStreamResponse } from "@/lib/to-agent-plain-text-stream-response";
import { getActorFromRequest } from "@/lib/actor-request";

const Surfaces: [EventAssistantSurface, ...EventAssistantSurface[]] = [
  "dashboard",
  "event-hub",
  "event-budget",
  "event-itinerary",
];

const BodySchema = z.object({
  eventId: z.string().min(1),
  surface: z.enum(Surfaces),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(14_000),
      })
    )
    .min(1)
    .max(28),
});

export async function POST(req: NextRequest) {
  const routeLog = createAgentLogger("event-assistant-api");
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const last = parsed.data.messages[parsed.data.messages.length - 1];
    if (last.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user." },
        { status: 400 }
      );
    }

    const actor = getActorFromRequest(req);
    routeLog.info("POST event-assistant", {
      eventId: parsed.data.eventId,
      surface: parsed.data.surface,
    });

    const messages = await buildEventAssistantMessages({
      eventId: parsed.data.eventId,
      surface: parsed.data.surface,
      history: parsed.data.messages,
    });

    const stream = createEventAssistantStream({
      eventId: parsed.data.eventId,
      surface: parsed.data.surface,
      messages,
      actorName: actor,
    });

    return toAgentPlainTextStreamResponse(stream, "event-assistant-stream");
  } catch (error) {
    routeLog.warn("event-assistant failed", { message: formatLlmError(error) });
    return NextResponse.json(
      { error: formatLlmError(error) },
      { status: 500 }
    );
  }
}
