import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { itineraryToPrintableHtml, type ExportItinerary } from "@/lib/export-itinerary";

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

  const html = itineraryToPrintableHtml(parsed, {
    eventName: event.name,
    destination: event.destination,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
