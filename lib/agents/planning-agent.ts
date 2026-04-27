import { google } from "@ai-sdk/google";
import { streamText, stepCountIs } from "ai";
import { GEMINI_MODEL } from "@/lib/ai-model";
import {
  createGeminiPrepareStep,
  getGeminiMaxRetries,
} from "@/lib/gemini-rate-limit";
import { createPlanningAgentStreamLogHooks } from "@/lib/agent-stream-log-hooks";
import { createAgentLogger } from "@/lib/agent-server-log";
import { z } from "zod";
import { searchHotels } from "@/lib/tools/search-hotels";
import { searchFlights } from "@/lib/tools/search-flights";
import { searchActivities } from "@/lib/tools/search-activities";
import { searchRestaurants } from "@/lib/tools/search-restaurants";
import { hotelNightCount, suggestedHotelMaxPerNight } from "@/lib/planning-guards";
import { persistItineraryForEvent } from "@/lib/persist-itinerary";

export const PLANNING_SYSTEM_PROMPT = `You are TravelOps Planning Agent — a principal-level corporate travel planner for regulated, budget-conscious companies.

## Non-negotiables (quality bar)

1. **Ground prices in tools** — Line-item EUR amounts must come from (or be conservative interpolations of) searchFlights, searchHotels, searchActivities, and searchRestaurants. Do not invent premium prices not supported by tool output.

2. **Approved budget is a hard ceiling** — When the user prompt includes an approved budget number, the sum of all line-item \`estimatedCost\` values MUST be ≤ that budget before calling saveItinerary. If the first combination overshoots, **trade down** (cheaper hotel tier, fewer tasting menus, economy flight options from results) until compliant. Never "note" overages as acceptable unless the user explicitly asked for an exception.

3. **Round-trip air for multi-day trips** — If the trip spans more than one calendar day (arrival ≠ departure day), the itinerary MUST contain **at least two** \`type: "flight"\` rows: outbound (home→destination on start date) and return (destination→home on end date), each with **estimatedCost > 0** from searchFlights totals. Never bury the return leg only in free-text with €0.

4. **Accounting integrity** — \`totalEstimatedCost\` must equal the sum of every line item’s \`estimatedCost\` (within trivial rounding). Recompute before save.

5. **Hotel search discipline** — Call searchHotels with \`maxPricePerNight\` when the user prompt suggests a cap, so results are pre-filtered.

6. **Corporate realism** — Allow sensible gaps between flight landing, hotel check-in, and first meal. Prefer venues with private dining / meeting space when the group is large.

7. **Grounding links** — For every line item chosen from searchFlights, searchHotels, searchActivities, or searchRestaurants, set \`sources\` to an array of \`{ label, url }\` objects copied from that tool row’s \`sourceLabel\` and \`sourceUrl\` (do not invent URLs). Flights on the same route/date may share the same discovery URL from the tool.

8. **Trust metadata** — Copy from each tool row onto the matching line item: \`priceQuotedAt\`, \`offerExpiresAt\`, \`dataProvenance\`, \`pricingContextNote\`. For **flight** rows also copy \`trackingUrl\` (FlightRadar24 data page for that flight number).

## Workflow (strict order)

1. searchFlights — outbound (origin→destination, start date).
2. searchFlights — return (destination→origin, end date) whenever rule (3) applies.
3. searchHotels — with nights derived from dates; respect maxPricePerNight when provided.
4. searchActivities — team-appropriate options.
5. searchRestaurants — mix of mid-tier and one nicer meal only if budget allows.
6. Compose day-by-day JSON with \`sources\` on each vendor line item; verify budget + flights + sum reconciliation.
7. saveItinerary — only when all checks pass; if save returns an error, fix the plan and retry.

Tone: concise, professional, EUR only.`;

const ItinerarySourceSchema = z.object({
  label: z.string().describe("e.g. Google Flights, Google Maps"),
  url: z
    .string()
    .describe("https URL copied from the search tool result (sourceUrl)"),
});

const ItineraryItemSchema = z.object({
  id: z
    .string()
    .optional()
    .describe("Stable line id (e.g. L-d1-i0); omit to let the server assign"),
  time: z.string(),
  type: z.enum(["flight", "hotel", "activity", "restaurant", "other"]),
  name: z.string(),
  description: z.string(),
  estimatedCost: z.number(),
  vendor: z.string().optional(),
  sources: z
    .array(ItinerarySourceSchema)
    .max(6)
    .optional()
    .describe(
      "Links from the tool row used for this line item (sourceLabel + sourceUrl); omit only for type 'other' or internal notes"
    ),
  priceQuotedAt: z
    .string()
    .optional()
    .describe("ISO timestamp from tool priceQuotedAt"),
  offerExpiresAt: z
    .string()
    .nullable()
    .optional()
    .describe("ISO suggested stale-after from tool offerExpiresAt"),
  dataProvenance: z.string().optional(),
  pricingContextNote: z.string().optional(),
  trackingUrl: z
    .string()
    .optional()
    .describe("FlightRadar24 URL from searchFlights trackingUrl for flight rows"),
});

const ItinerarySchema = z.object({
  days: z.array(
    z.object({
      day: z.number(),
      date: z.string(),
      title: z.string(),
      items: z.array(ItineraryItemSchema),
    })
  ),
  totalEstimatedCost: z.number(),
  summary: z.string(),
  itineraryQuotedAt: z.string().optional(),
  dataProvenance: z.string().optional(),
  pricingTrustNote: z.string().optional(),
});

function buildPlanningUserPrompt(params: {
  destination: string;
  startDate: string;
  endDate: string;
  participants: number;
  budget?: number;
  /** Tighter ceiling than approved budget (structured caps / savings intent). */
  effectiveBudgetCeiling?: number;
  /** Structured JSON-derived lines only (free-text notes stay in preferences). */
  planningConstraintBlock?: string;
  preferences?: string;
  origin?: string;
}): string {
  const origin = params.origin?.trim() || "Bucharest, Romania";
  const nights = hotelNightCount(params.startDate, params.endDate);
  const approved = params.budget != null && params.budget > 0 ? params.budget : undefined;
  const strict =
    params.effectiveBudgetCeiling != null &&
    params.effectiveBudgetCeiling > 0 &&
    Number.isFinite(params.effectiveBudgetCeiling)
      ? params.effectiveBudgetCeiling
      : approved;

  const hotelCap = suggestedHotelMaxPerNight(
    strict,
    params.participants,
    nights
  );

  const budgetBlock =
    strict != null && strict > 0
      ? approved != null &&
        approved > 0 &&
        strict < approved - 0.01
        ? `- Approved **finance budget**: €${approved}
- **Planning ceiling** (hard before save): €${strict} — sum of all line-item estimatedCost must be ≤ this (stricter than finance cap when the team queued savings or caps)
- Suggested **searchHotels maxPricePerNight**: €${hotelCap ?? "—"} (~32% of planning ceiling ÷ ${nights} hotel night(s) ÷ rooms; pass this into searchHotels)`
        : `- Approved **total event budget**: €${strict} (hard ceiling — sum of all line-item estimatedCost must be ≤ this before save)
- Suggested **searchHotels maxPricePerNight**: €${hotelCap ?? "—"} (~32% of budget ÷ ${nights} hotel night(s) ÷ rooms; pass this into searchHotels)`
      : "- No fixed budget was set; still ground all EUR amounts in tool results";

  const structuredExtra = params.planningConstraintBlock?.trim()
    ? `\n- Structured caps (machine-checked on save):\n${params.planningConstraintBlock.trim()}`
    : "";

  return `Plan and persist a corporate event with these facts:

- Destination: ${params.destination}
- Dates: ${params.startDate} (first day) through ${params.endDate} (last day / departure)
- Participants: ${params.participants}
- Origin (home / travel-from): ${origin}
${budgetBlock}
${params.preferences ? `- Preferences / constraints: ${params.preferences}` : ""}${structuredExtra}

## Search checklist (run before composing JSON)
1. **searchFlights** — outbound: "${origin}" → "${params.destination}" on **${params.startDate}**.
2. **searchFlights** — return: "${params.destination}" → "${origin}" on **${params.endDate}** (required whenever the trip spans more than one calendar day).
3. **searchHotels** — "${params.destination}", check-in ${params.startDate}, check-out ${params.endDate}, ${params.participants} guests${hotelCap != null ? `, maxPricePerNight ${hotelCap}` : ""}.
4. **searchActivities** and **searchRestaurants** — "${params.destination}" for the group.

## Build rules
- Include the **return flight** as its own \`flight\` line item on the departure day with **estimatedCost > 0** from the return search (never €0 placeholder text).
- Prefer **mid-tier** tool results first; upgrade only if the running total stays under budget.
- **totalEstimatedCost** must equal the sum of every line-item **estimatedCost** (recompute before save).
- For each flight, hotel, activity, and restaurant line item, set \`sources: [{ label, url }]\` using the **sourceLabel** and **sourceUrl** fields from the exact tool option you selected.
- Copy **priceQuotedAt**, **offerExpiresAt**, **dataProvenance**, **pricingContextNote** from that tool row onto each line item; for flights also copy **trackingUrl**.

Then call **saveItinerary** with the itinerary object only.`;
}

export function createPlanningAgentStream(params: {
  eventId: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: number;
  budget?: number;
  effectiveBudgetCeiling?: number;
  planningConstraintBlock?: string;
  preferences?: string;
  origin?: string;
  /** For audit trail on itinerary save */
  actorName?: string;
}) {
  return streamText({
    ...createPlanningAgentStreamLogHooks({
      eventId: params.eventId,
      destination: params.destination,
    }),
    model: google(GEMINI_MODEL),
    system: PLANNING_SYSTEM_PROMPT,
    maxRetries: getGeminiMaxRetries(),
    prepareStep: createGeminiPrepareStep(),
    stopWhen: stepCountIs(10),
    prompt: buildPlanningUserPrompt({
      destination: params.destination,
      startDate: params.startDate,
      endDate: params.endDate,
      participants: params.participants,
      budget: params.budget,
      effectiveBudgetCeiling: params.effectiveBudgetCeiling,
      planningConstraintBlock: params.planningConstraintBlock,
      preferences: params.preferences,
      origin: params.origin,
    }),
    tools: {
      searchFlights: {
        description:
          "Search flight options with realistic EUR pricing. Each option includes sourceLabel, sourceUrl, priceQuotedAt, offerExpiresAt, dataProvenance, pricingContextNote, trackingUrl (FlightRadar24) — copy all onto matching flight line items. For multi-day trips call twice: (1) outbound origin→destination on the start date, (2) return destination→origin on the end date. Use totals returned to set line-item costs.",
        inputSchema: z.object({
          origin: z.string().describe("Departure city/airport"),
          destination: z.string().describe("Arrival city/airport"),
          date: z.string().describe("Departure date YYYY-MM-DD"),
          participants: z.number().describe("Number of travellers"),
        }),
        execute: async (args: {
          origin: string;
          destination: string;
          date: string;
          participants: number;
        }) => searchFlights(args),
      },
      searchHotels: {
        description:
          "Search hotel accommodation. Each option includes sourceLabel, sourceUrl, priceQuotedAt, offerExpiresAt, dataProvenance, pricingContextNote — copy onto hotel line items. Always pass maxPricePerNight when the user prompt gives a suggested cap so results stay budget-safe. Returns nightly totals for the stay.",
        inputSchema: z.object({
          location: z.string().describe("City or destination"),
          checkIn: z.string().describe("Check-in date YYYY-MM-DD"),
          checkOut: z.string().describe("Check-out date YYYY-MM-DD"),
          participants: z.number().describe("Number of guests"),
          maxPricePerNight: z
            .number()
            .optional()
            .describe("Maximum price per room per night in EUR"),
        }),
        execute: async (args: {
          location: string;
          checkIn: string;
          checkOut: string;
          participants: number;
          maxPricePerNight?: number;
        }) => searchHotels(args),
      },
      searchActivities: {
        description:
          "Search team building activities, tours, and experiences. Each option includes full trust metadata (source*, priceQuotedAt, offerExpiresAt, dataProvenance, pricingContextNote) — copy onto activity line items.",
        inputSchema: z.object({
          location: z.string().describe("City or destination"),
          type: z
            .enum(["team-building", "tour", "outdoor", "cultural"])
            .optional()
            .describe("Type of activity"),
          participants: z.number().describe("Number of participants"),
        }),
        execute: async (args: {
          location: string;
          type?: "team-building" | "tour" | "outdoor" | "cultural";
          participants: number;
        }) => searchActivities(args),
      },
      searchRestaurants: {
        description:
          "Search restaurants for corporate groups. Each option includes full trust metadata — copy onto restaurant line items.",
        inputSchema: z.object({
          location: z.string().describe("City or destination"),
          cuisine: z
            .string()
            .optional()
            .describe("Preferred cuisine type (optional)"),
          participants: z.number().describe("Number of diners"),
        }),
        execute: async (args: {
          location: string;
          cuisine?: string;
          participants: number;
        }) => searchRestaurants(args),
      },
      saveItinerary: {
        description:
          "Save the final generated itinerary to the database for the current event. Call after building the complete itinerary. Pass only the itinerary object.",
        inputSchema: z.object({
          itinerary: ItinerarySchema.describe("Structured itinerary object"),
        }),
        execute: async (args: { itinerary: z.infer<typeof ItinerarySchema> }) => {
          const { itinerary } = args;
          const eventId = params.eventId;
          const originCity = params.origin?.trim() || "Bucharest";

          const result = await persistItineraryForEvent({
            eventId,
            itinerary,
            policy: {
              budget: params.budget ?? undefined,
              startDate: params.startDate,
              endDate: params.endDate,
              destination: params.destination,
              originCity,
            },
            actorName: params.actorName?.trim() || "Planning agent",
          });

          if (!result.ok) {
            createAgentLogger("planning").warn("saveItinerary rejected or failed", {
              eventId,
              reason: result.error,
            });
            return {
              success: false as const,
              error: result.error,
            };
          }

          return {
            success: true as const,
            message: "Itinerary saved successfully",
            totalCost: result.totalCost,
            versionNumber: result.versionNumber,
          };
        },
      },
    },
  });
}
