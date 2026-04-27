import { NextRequest, NextResponse } from "next/server";
import { createPlanningAgentStream } from "@/lib/agents/planning-agent";
import { createAgentLogger } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";
import { toAgentPlainTextStreamResponse } from "@/lib/to-agent-plain-text-stream-response";

export async function POST(req: NextRequest) {
  const routeLog = createAgentLogger("planning-api");
  try {
    const body = await req.json();

    if (!body?.eventId || typeof body.eventId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid eventId." },
        { status: 400 }
      );
    }

    routeLog.info("POST /api/agents/planning accepted", {
      eventId: body.eventId,
      destination: body.destination,
    });

    const stream = createPlanningAgentStream({
      eventId: body.eventId,
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      participants: body.participants,
      budget: body.budget,
      preferences: body.preferences,
      origin: body.origin,
    });

    return toAgentPlainTextStreamResponse(stream, "planning-stream");
  } catch (error) {
    routeLog.warn("POST /api/agents/planning failed before stream", {
      message: formatLlmError(error),
    });
    return NextResponse.json(
      { error: formatLlmError(error) },
      { status: 500 }
    );
  }
}
