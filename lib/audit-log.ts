import { prisma } from "@/lib/db";

export async function writeAuditLog(params: {
  eventId?: string | null;
  organizationId?: string | null;
  actorName: string;
  action: string;
  payload?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      eventId: params.eventId ?? undefined,
      organizationId: params.organizationId ?? undefined,
      actorName: params.actorName.slice(0, 120),
      action: params.action.slice(0, 200),
      payload:
        params.payload !== undefined
          ? JSON.stringify(params.payload).slice(0, 8000)
          : undefined,
    },
  });
}
