import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EventUpsertBodySchema } from "@/lib/events-api-schema";
import { ensureDefaultOrganization } from "@/lib/workspace";

export async function GET() {
  await ensureDefaultOrganization();
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

  const org = await ensureDefaultOrganization();
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
      organizationId: org.id,
      planningStatus: "DRAFT",
    },
  });

  return NextResponse.json(event, { status: 201 });
}
