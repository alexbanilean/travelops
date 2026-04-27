/** Calendar-day difference: same calendar day → 0; multi-day trip → ≥1. */
export function calendarDaySpan(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** Hotel-style night count between check-in and check-out dates (inclusive logic matches search-hotels). */
export function hotelNightCount(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T12:00:00.000Z`).getTime();
  const b = new Date(`${checkOut}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

export type ItineraryShape = {
  days: Array<{
    date?: string;
    items: Array<{
      type: string;
      estimatedCost: number;
      name?: string;
      sources?: Array<{ label?: string; url?: string }>;
    }>;
  }>;
  totalEstimatedCost: number;
};

function itemHasHttpSource(item: {
  sources?: Array<{ label?: string; url?: string }>;
}): boolean {
  if (!item.sources?.length) return false;
  for (const s of item.sources) {
    if (!s?.url || typeof s.url !== "string") continue;
    try {
      const u = new URL(s.url);
      if (u.protocol === "http:" || u.protocol === "https:") return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function sumLineItemCosts(itinerary: ItineraryShape): number {
  let sum = 0;
  for (const day of itinerary.days) {
    for (const item of day.items) {
      sum += item.estimatedCost;
    }
  }
  return Math.round(sum * 100) / 100;
}

export function countFlights(itinerary: ItineraryShape): number {
  let n = 0;
  for (const day of itinerary.days) {
    for (const item of day.items) {
      if (item.type === "flight") n += 1;
    }
  }
  return n;
}

/** Reject day rows whose `date` falls outside the event window (YYYY-MM-DD). */
export function validateItineraryDayDates(
  itinerary: ItineraryShape,
  startDate: string,
  endDate: string
): { ok: true } | { ok: false; error: string } {
  const start = new Date(`${startDate}T12:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { ok: true };

  for (const day of itinerary.days) {
    const raw = day.date?.trim();
    if (!raw) continue;
    const t = new Date(`${raw}T12:00:00.000Z`).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < start || t > end) {
      return {
        ok: false,
        error: `Itinerary day "${raw}" is outside the event dates ${startDate}–${endDate}. Regenerate with days aligned to the trip window.`,
      };
    }
  }
  return { ok: true };
}

export function validateItineraryForSave(
  itinerary: ItineraryShape,
  policy: {
    budget?: number;
    /** Stricter ceiling than approved budget (structured caps / savings intent). */
    effectiveBudgetCap?: number;
    startDate: string;
    endDate: string;
    destination: string;
    originCity: string;
  }
): { ok: true } | { ok: false; error: string } {
  const sumItems = sumLineItemCosts(itinerary);
  const declared = itinerary.totalEstimatedCost;

  const drift =
    declared === 0
      ? sumItems === 0
        ? 0
        : 1
      : Math.abs(declared - sumItems) / declared;

  if (drift > 0.02 && Math.abs(declared - sumItems) > 5) {
    return {
      ok: false,
      error: `totalEstimatedCost (€${declared}) must match the sum of all line-item estimatedCost values (€${sumItems}). Recompute the total or fix line items before saving.`,
    };
  }

  const ceiling =
    policy.effectiveBudgetCap != null &&
    policy.effectiveBudgetCap > 0 &&
    Number.isFinite(policy.effectiveBudgetCap)
      ? policy.effectiveBudgetCap
      : policy.budget != null && policy.budget > 0
        ? policy.budget
        : undefined;

  if (ceiling != null && sumItems > ceiling) {
    const label =
      policy.effectiveBudgetCap != null &&
      policy.effectiveBudgetCap > 0 &&
      policy.effectiveBudgetCap < (policy.budget ?? Infinity)
        ? `planning target (€${ceiling}, under the approved €${policy.budget ?? ceiling} budget)`
        : `approved budget of €${ceiling}`;
    return {
      ok: false,
      error: `Itinerary total €${sumItems} exceeds the ${label}. Replace premium picks with lower-priced options from your search tool results until the sum is at or under the ceiling, then save again.`,
    };
  }

  const span = calendarDaySpan(policy.startDate, policy.endDate);
  if (span >= 1) {
    const flights = countFlights(itinerary);
    if (flights < 2) {
      return {
        ok: false,
        error: `Multi-day trips require at least two line items with type "flight": (1) outbound ${policy.originCity}→${policy.destination} on ${policy.startDate}, (2) return ${policy.destination}→${policy.originCity} on ${policy.endDate}, each with estimatedCost from searchFlights. Do not fold the return into prose with €0.`,
      };
    }

    for (const day of itinerary.days) {
      for (const item of day.items) {
        if (item.type === "flight" && item.estimatedCost <= 0) {
          return {
            ok: false,
            error: `Every flight line item must have estimatedCost > 0 (corporate cost capture). Update flights using searchFlights totals.`,
          };
        }
      }
    }
  }

  const vendorTypes = new Set(["flight", "hotel", "activity", "restaurant"]);
  for (const day of itinerary.days) {
    for (const item of day.items) {
      if (!vendorTypes.has(item.type)) continue;
      if (!itemHasHttpSource(item)) {
        return {
          ok: false,
          error: `Each ${item.type} line item ("${item.name ?? "untitled"}") must include sources: [{ label, url }] with at least one https URL copied from the search tool result (sourceLabel + sourceUrl).`,
        };
      }
    }
  }

  return { ok: true };
}

/** Suggested hotel price cap to pass into searchHotels.maxPricePerNight (rough 32% of budget to lodging). */
export function suggestedHotelMaxPerNight(
  budget: number | undefined,
  participants: number,
  nights: number
): number | undefined {
  if (budget == null || budget <= 0 || nights < 1) return undefined;
  const rooms = Math.ceil(Math.max(1, participants) / 2);
  const lodgingBudget = budget * 0.32;
  const perNightTotal = lodgingBudget / Math.max(1, nights);
  const perRoomPerNight = perNightTotal / Math.max(1, rooms);
  return Math.max(70, Math.floor(perRoomPerNight));
}
