import type { Prisma } from "@prisma/client";

export type ItineraryItemForSync = {
  id?: string;
  type: string;
  name: string;
  estimatedCost: number;
};

export type ItineraryDayForSync = {
  day: number;
  items: ItineraryItemForSync[];
};

export type ItineraryForSync = {
  days: ItineraryDayForSync[];
};

/** Assign stable line ids for expense linkage (idempotent if already set). */
export function assignItineraryLineIds<T extends ItineraryForSync>(itinerary: T): T {
  const copy = structuredClone(itinerary) as T;
  for (const day of copy.days) {
    day.items.forEach((item, idx) => {
      if (!item.id || String(item.id).trim() === "") {
        item.id = `L-d${day.day}-i${idx}`;
      }
    });
  }
  return copy;
}

function mapItemTypeToCategory(type: string): string {
  switch (type) {
    case "flight":
      return "transport";
    case "hotel":
      return "accommodation";
    case "activity":
      return "activities";
    case "restaurant":
      return "food";
    default:
      return "activities";
  }
}

export type LineAllocation = { lineKey: string; label: string; amount: number };

/**
 * Upserts category expense rows from itinerary line items + JSON line allocations.
 */
export async function syncExpensesFromItinerary(
  eventId: string,
  itinerary: ItineraryForSync,
  db: Prisma.TransactionClient
): Promise<void> {
  const aggregates: Record<
    string,
    { estimated: number; lines: LineAllocation[] }
  > = {};

  for (const day of itinerary.days) {
    day.items.forEach((item, idx) => {
      const cat = mapItemTypeToCategory(item.type);
      if (!aggregates[cat]) aggregates[cat] = { estimated: 0, lines: [] };
      aggregates[cat].estimated += item.estimatedCost;
      const key = item.id?.trim() || `L-d${day.day}-i${idx}`;
      aggregates[cat].lines.push({
        lineKey: key,
        label: item.name,
        amount: item.estimatedCost,
      });
    });
  }

  for (const [category, { estimated, lines }] of Object.entries(aggregates)) {
    if (estimated <= 0) continue;
    const lineAllocations = JSON.stringify(lines);
    const existing = await db.expense.findFirst({
      where: { eventId, category },
    });
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    if (existing) {
      await db.expense.update({
        where: { id: existing.id },
        data: { estimated, lineAllocations, label },
      });
    } else {
      await db.expense.create({
        data: {
          eventId,
          category,
          label,
          estimated,
          lineAllocations,
        },
      });
    }
  }
}
