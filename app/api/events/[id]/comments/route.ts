import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { getActorFromRequest } from "@/lib/actor-request";

const PostSchema = z.object({
  body: z.string().min(1).max(8000),
  authorName: z.string().max(120).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.eventComment.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json();
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const actor = getActorFromRequest(req);
  const authorName =
    parsed.data.authorName?.trim() || actor || "Anonymous";

  const comment = await prisma.eventComment.create({
    data: {
      eventId: id,
      authorName: authorName.slice(0, 120),
      body: parsed.data.body.trim(),
    },
  });

  await writeAuditLog({
    eventId: id,
    organizationId: event.organizationId,
    actorName: authorName.slice(0, 120),
    action: "COMMENT_ADDED",
    payload: { commentId: comment.id },
  });

  return NextResponse.json(comment, { status: 201 });
}
