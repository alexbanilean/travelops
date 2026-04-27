import { NextRequest, NextResponse } from "next/server";
import { createPlanningAgentStream } from "@/lib/agents/planning-agent";
import { createAgentLogger } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";
import { toAgentPlainTextStreamResponse } from "@/lib/to-agent-plain-text-stream-response";
import { prisma } from "@/lib/db";
import {
  computeEffectiveBudgetCap,
  formatConstraintsForPrompt,
} from "@/lib/planning-constraints";
import { getActorFromRequest } from "@/lib/actor-request";
import { ensureDefaultOrganization } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  const routeLog = createAgentLogger("planning-api");
  try {
    await ensureDefaultOrganization();
    const body = await req.json();

    if (!body?.eventId || typeof body.eventId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid eventId." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      select: {
        preferences: true,
        pendingPlanningNotes: true,
        planningConstraintsJson: true,
        budget: true,
      },
    });

    const mergedPreferences =
      [
        event?.preferences,
        typeof body.preferences === "string" ? body.preferences : null,
        event?.pendingPlanningNotes,
        typeof body.additionalPreferences === "string"
          ? body.additionalPreferences
          : null,
      ]
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .join("\n\n---\n\n") || undefined;

    routeLog.info("POST /api/agents/planning accepted", {
      eventId: body.eventId,
      destination: body.destination,
    });

    const approvedBudget =
      typeof body.budget === "number" && body.budget > 0
        ? body.budget
        : (event?.budget ?? undefined);
    const effectiveCeiling = computeEffectiveBudgetCap({
      approvedBudget: approvedBudget ?? event?.budget ?? undefined,
      constraintsJson: event?.planningConstraintsJson,
      pendingNotes: event?.pendingPlanningNotes,
    });
    const planningConstraintBlock = formatConstraintsForPrompt(
      event?.planningConstraintsJson,
      null
    );

    const stream = createPlanningAgentStream({
      eventId: body.eventId,
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      participants: body.participants,
      budget: approvedBudget,
      effectiveBudgetCeiling: effectiveCeiling,
      planningConstraintBlock: planningConstraintBlock || undefined,
      preferences: mergedPreferences,
      origin: body.origin,
      actorName: getActorFromRequest(req),
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
