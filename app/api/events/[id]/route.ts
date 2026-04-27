import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EventUpsertBodySchema } from "@/lib/events-api-schema";
import { EventPatchBodySchema } from "@/lib/events-patch-schema";
import { writeAuditLog } from "@/lib/audit-log";
import { getActorFromRequest } from "@/lib/actor-request";
import { ensureDefaultOrganization } from "@/lib/workspace";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDefaultOrganization();
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      expenses: true,
      invoices: true,
      itineraryVersions: {
        orderBy: { versionNumber: "desc" },
        take: 25,
        select: {
          id: true,
          versionNumber: true,
          totalEstimated: true,
          summaryLine: true,
          createdAt: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 40,
      },
    },
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
  const actor = getActorFromRequest(req);

  const fullParse = EventUpsertBodySchema.safeParse(body);
  if (fullParse.success) {
    const data = fullParse.data;
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
      include: {
        expenses: true,
        invoices: true,
        itineraryVersions: {
          orderBy: { versionNumber: "desc" },
          take: 25,
          select: {
            id: true,
            versionNumber: true,
            totalEstimated: true,
            summaryLine: true,
            createdAt: true,
          },
        },
        comments: { orderBy: { createdAt: "desc" }, take: 40 },
      },
    });
    await writeAuditLog({
      eventId: id,
      organizationId: existing.organizationId,
      actorName: actor,
      action: "EVENT_UPDATED",
      payload: { fields: "core" },
    });
    return NextResponse.json(event);
  }

  const parsed = EventPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return NextResponse.json({ error: "Empty patch" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (d.name !== undefined) data.name = d.name;
  if (d.destination !== undefined) data.destination = d.destination;
  if (d.startDate !== undefined) data.startDate = new Date(d.startDate);
  if (d.endDate !== undefined) data.endDate = new Date(d.endDate);
  if (d.participants !== undefined) data.participants = d.participants;
  if (d.budget !== undefined) data.budget = d.budget;
  if (d.preferences !== undefined) data.preferences = d.preferences;
  if (d.pendingPlanningNotes !== undefined) {
    data.pendingPlanningNotes = d.pendingPlanningNotes;
  }
  if (d.budgetReviewStale !== undefined) data.budgetReviewStale = d.budgetReviewStale;
  if (d.lastFinanceReviewAt !== undefined) {
    data.lastFinanceReviewAt = d.lastFinanceReviewAt
      ? new Date(d.lastFinanceReviewAt)
      : null;
  }

  if (d.planningStatus !== undefined) {
    data.planningStatus = d.planningStatus;
    if (d.planningStatus === "APPROVED") {
      data.approvedAt = new Date();
      data.approvedByName =
        (d.approvedByName?.trim() || actor || "Unknown").slice(0, 200);
    } else {
      data.approvedAt = null;
      data.approvedByName = null;
    }
  } else if (d.approvedByName !== undefined) {
    data.approvedByName = d.approvedByName;
  }

  const event = await prisma.event.update({
    where: { id },
    data: data as Parameters<typeof prisma.event.update>[0]["data"],
    include: {
      expenses: true,
      invoices: true,
      itineraryVersions: {
        orderBy: { versionNumber: "desc" },
        take: 25,
        select: {
          id: true,
          versionNumber: true,
          totalEstimated: true,
          summaryLine: true,
          createdAt: true,
        },
      },
      comments: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });

  if (d.planningStatus !== undefined) {
    await writeAuditLog({
      eventId: id,
      organizationId: existing.organizationId,
      actorName: actor,
      action:
        d.planningStatus === "APPROVED"
          ? "PLAN_APPROVED"
          : "PLANNING_STATUS_CHANGED",
      payload: { planningStatus: d.planningStatus },
    });
  }

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
