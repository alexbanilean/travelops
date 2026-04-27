import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EventUpsertBodySchema } from "@/lib/events-api-schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { expenses: true, invoices: true },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = EventUpsertBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const event = await prisma.event.update({
    where: { id },
    data: {
      name: data.name,
      destination: data.destination,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      participants: data.participants,
      budget: data.budget ?? null,
      preferences: data.preferences ?? null,
    },
    include: { expenses: true, invoices: true },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
