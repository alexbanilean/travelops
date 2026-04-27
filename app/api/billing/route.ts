import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultOrganization } from "@/lib/workspace";

/**
 * Demo billing snapshot. Wire Stripe webhooks + customer portal in production.
 */
export async function GET() {
  const org = await ensureDefaultOrganization();
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: org.id },
  });

  return NextResponse.json({
    organizationId: org.id,
    organizationName: org.name,
    planTier: sub?.planTier ?? "FREE",
    status: sub?.status ?? "none",
    stripeCustomerId: sub?.stripeCustomerId ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    message:
      "Demo mode: no Stripe charges. Upgrade path in production connects checkout + webhooks here.",
  });
}
