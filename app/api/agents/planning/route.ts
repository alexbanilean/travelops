import { NextRequest } from "next/server";
import { createPlanningAgentStream } from "@/lib/agents/planning-agent";

export async function POST(req: NextRequest) {
  const body = await req.json();

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

  return stream.toTextStreamResponse();
}
