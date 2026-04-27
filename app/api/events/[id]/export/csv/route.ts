import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { itineraryToCsv, type ExportItinerary } from "@/lib/export-itinerary";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event?.itinerary) {
    return NextResponse.json({ error: "No itinerary" }, { status: 400 });
  }
  let parsed: ExportItinerary;
  try {
    parsed = JSON.parse(event.itinerary) as ExportItinerary;
  } catch {
    return NextResponse.json({ error: "Invalid itinerary" }, { status: 400 });
  }

  const csv = itineraryToCsv(parsed, {
    eventName: event.name,
    destination: event.destination,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="travelops-${id}-itinerary.csv"`,
    },
  });
}
