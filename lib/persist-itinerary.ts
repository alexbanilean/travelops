import { prisma } from "@/lib/db";
import {
  sumLineItemCosts,
  validateItineraryDayDates,
  validateItineraryForSave,
} from "@/lib/planning-guards";
import { computeEffectiveBudgetCap } from "@/lib/planning-constraints";
import {
  DATA_PROVENANCE_SYNTHETIC_DEMO,
  DEMO_PRICING_DISCLAIMER,
} from "@/lib/travel-data-provenance";
import { writeAuditLog } from "@/lib/audit-log";
import {
  assignItineraryLineIds,
  syncExpensesFromItinerary,
  type ItineraryForSync,
} from "@/lib/itinerary-expense-sync";

export type PersistItineraryPolicy = {
  budget?: number;
  startDate: string;
  endDate: string;
  destination: string;
  originCity: string;
};

export type PersistItineraryInput = {
  eventId: string;
  itinerary: ItineraryForSync & {
    totalEstimatedCost: number;
    summary: string;
    itineraryQuotedAt?: string;
    dataProvenance?: string;
    pricingTrustNote?: string;
  };
  policy: PersistItineraryPolicy;
  actorName: string;
};

export async function persistItineraryForEvent(
  input: PersistItineraryInput
): Promise<
  { ok: true; versionNumber: number; totalCost: number } | { ok: false; error: string }
> {
  const { eventId, policy, actorName } = input;
  const itinerary = assignItineraryLineIds(
    input.itinerary as ItineraryForSync & typeof input.itinerary
  );

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!event) {
    return { ok: false, error: `Event not found (id: ${eventId}).` };
  }

  const effectiveCap = computeEffectiveBudgetCap({
    approvedBudget: event.budget ?? policy.budget,
    constraintsJson: event.planningConstraintsJson,
    pendingNotes: event.pendingPlanningNotes,
  });

  const datesGate = validateItineraryDayDates(
    itinerary,
    policy.startDate,
    policy.endDate
  );
  if (!datesGate.ok) {
    return { ok: false, error: datesGate.error };
  }

  const gate = validateItineraryForSave(itinerary, {
    budget: event.budget ?? policy.budget ?? undefined,
    effectiveBudgetCap: effectiveCap,
    startDate: policy.startDate,
    endDate: policy.endDate,
    destination: policy.destination,
    originCity: policy.originCity,
  });
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const savedAt = new Date().toISOString();
  const enrichedItinerary = {
    ...itinerary,
    itineraryQuotedAt: savedAt,
    dataProvenance: DATA_PROVENANCE_SYNTHETIC_DEMO,
    pricingTrustNote: DEMO_PRICING_DISCLAIMER,
  };

  const json = JSON.stringify(enrichedItinerary);
  const sumItems = sumLineItemCosts(enrichedItinerary);
  const summaryLine =
    enrichedItinerary.summary?.slice(0, 500) ||
    `Itinerary v${savedAt.slice(0, 10)}`;

  const last = await prisma.itineraryVersion.findFirst({
    where: { eventId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (last?.versionNumber ?? 0) + 1;

  const nextPlanningStatus = "PENDING_REVIEW";

  await prisma.$transaction(async (tx) => {
    await tx.itineraryVersion.create({
      data: {
        eventId,
        versionNumber,
        itineraryJson: json,
        totalEstimated: sumItems,
        summaryLine,
      },
    });

    await tx.event.update({
      where: { id: eventId },
      data: {
        itinerary: json,
        itineraryUpdatedAt: new Date(),
        budgetReviewStale: true,
        planningStatus: nextPlanningStatus,
        pendingPlanningNotes: null,
        planningConstraintsJson: null,
      },
    });

    await syncExpensesFromItinerary(eventId, enrichedItinerary, tx);
  });

  await writeAuditLog({
    eventId,
    organizationId: event.organizationId,
    actorName,
    action: "ITINERARY_SAVED",
    payload: { versionNumber, totalEstimated: sumItems },
  });

  return {
    ok: true,
    versionNumber,
    totalCost: enrichedItinerary.totalEstimatedCost,
  };
}

export async function restoreItineraryVersion(params: {
  eventId: string;
  versionId: string;
  actorName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { eventId, versionId, actorName } = params;
  const version = await prisma.itineraryVersion.findFirst({
    where: { id: versionId, eventId },
  });
  if (!version) {
    return { ok: false, error: "Version not found." };
  }

  let parsed: ItineraryForSync & { totalEstimatedCost?: number };
  try {
    parsed = JSON.parse(version.itineraryJson) as typeof parsed;
  } catch {
    return { ok: false, error: "Invalid stored itinerary JSON." };
  }

  const withIds = assignItineraryLineIds(parsed);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, error: "Event not found." };

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        itinerary: JSON.stringify(withIds),
        itineraryUpdatedAt: new Date(),
        budgetReviewStale: true,
        planningStatus:
          event.planningStatus === "APPROVED"
            ? "PENDING_REVIEW"
            : event.planningStatus,
      },
    });
    await syncExpensesFromItinerary(eventId, withIds, tx);
  });

  await writeAuditLog({
    eventId,
    organizationId: event.organizationId,
    actorName,
    action: "ITINERARY_VERSION_RESTORED",
    payload: { versionId, versionNumber: version.versionNumber },
  });

  return { ok: true };
}

/** Build planning policy from an event row + optional origin override. */
export function policyFromEvent(
  event: {
    budget: number | null;
    startDate: Date;
    endDate: Date;
    destination: string;
  },
  originCity?: string
): PersistItineraryPolicy {
  const startDate = event.startDate.toISOString().slice(0, 10);
  const endDate = event.endDate.toISOString().slice(0, 10);
  return {
    budget: event.budget ?? undefined,
    startDate,
    endDate,
    destination: event.destination,
    originCity: originCity?.trim() || "Bucharest",
  };
}
