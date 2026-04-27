import { prisma } from "@/lib/db";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/constants-workspace";

/**
 * Ensures a default org, subscription row, at least one member, and backfills events without orgId.
 * Safe to call from any API handler (idempotent).
 */
export async function ensureDefaultOrganization() {
  const org = await prisma.organization.upsert({
    where: { id: DEFAULT_ORGANIZATION_ID },
    create: {
      id: DEFAULT_ORGANIZATION_ID,
      name: "My workspace",
    },
    update: {},
  });

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      planTier: "FREE",
      status: "active",
    },
    update: {},
  });

  const memberCount = await prisma.workspaceMember.count({
    where: { orgId: org.id },
  });
  if (memberCount === 0) {
    await prisma.workspaceMember.create({
      data: {
        orgId: org.id,
        displayName: "Workspace owner",
        role: "OWNER",
      },
    });
  }

  await prisma.event.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });

  return org;
}
