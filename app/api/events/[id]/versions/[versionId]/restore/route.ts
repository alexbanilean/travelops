import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { restoreItineraryVersion } from "@/lib/persist-itinerary";
import { getActorFromRequest } from "@/lib/actor-request";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const actor = getActorFromRequest(req);
  const result = await restoreItineraryVersion({
    eventId: id,
    versionId,
    actorName: actor,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const event = await prisma.event.findUnique({
    where: { id },
    include: { expenses: true, invoices: true },
  });
  return NextResponse.json(event);
}
