import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs = await prisma.auditLog.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
  return NextResponse.json(logs);
}
