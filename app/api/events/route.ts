import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EventUpsertBodySchema } from "@/lib/events-api-schema";

export async function GET() {
  const events = await prisma.event.findMany({
    include: { expenses: true, invoices: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = EventUpsertBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const event = await prisma.event.create({
    data: {
      name: d.name,
      destination: d.destination,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      participants: d.participants,
      budget: d.budget ?? null,
      preferences: d.preferences ?? null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
