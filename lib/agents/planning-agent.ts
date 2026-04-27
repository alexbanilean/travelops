import { google } from "@ai-sdk/google";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { searchHotels } from "@/lib/tools/search-hotels";
import { searchFlights } from "@/lib/tools/search-flights";
import { searchActivities } from "@/lib/tools/search-activities";
import { searchRestaurants } from "@/lib/tools/search-restaurants";
import { prisma } from "@/lib/db";

export const PLANNING_SYSTEM_PROMPT = `You are TravelOps Planning Agent, an expert corporate travel concierge AI for Fortune 1000 companies.

Your role is to create detailed, professional corporate event itineraries. When given event details (destination, dates, participants, budget, preferences), you MUST:

1. Call searchFlights to find transport options
2. Call searchHotels to find accommodation 
3. Call searchActivities to find team building / activities
4. Call searchRestaurants to find dining options
5. Build a structured day-by-day itinerary based on the results
6. Call saveItinerary to persist the final itinerary

Always present results in a clear, structured format with:
- Day-by-day breakdown
- Specific vendor recommendations with prices
- Total estimated costs per category
- Budget summary

Be professional, concise, and focused on corporate needs. Prioritize options that have private meeting/event spaces when relevant.`;

const ItineraryItemSchema = z.object({
  time: z.string(),
  type: z.enum(["flight", "hotel", "activity", "restaurant", "other"]),
  name: z.string(),
  description: z.string(),
  estimatedCost: z.number(),
  vendor: z.string().optional(),
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
});

export function createPlanningAgentStream(params: {
  eventId: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: number;
  budget?: number;
  preferences?: string;
  origin?: string;
}) {
  return streamText({
    model: google("gemini-2.0-flash"),
    system: PLANNING_SYSTEM_PROMPT,
    stopWhen: stepCountIs(8),
    prompt: `Plan a corporate event with the following details:
- Destination: ${params.destination}
- Dates: ${params.startDate} to ${params.endDate}
- Number of participants: ${params.participants}
${params.budget ? `- Budget: €${params.budget}` : ""}
${params.preferences ? `- Preferences: ${params.preferences}` : ""}
${params.origin ? `- Departing from: ${params.origin}` : "- Departing from: Bucharest, Romania"}

Please search for flights, hotels, activities, and restaurants, then create a complete day-by-day itinerary and save it.`,
    tools: {
      searchFlights: {
        description:
          "Search for flight options for the corporate trip. Returns available flights with pricing.",
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
          "Search for hotel accommodation options. Returns hotels with room availability and pricing.",
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
          "Search for team building activities, tours, and experiences at the destination.",
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
          "Search for restaurants and dining options suitable for corporate groups.",
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
          "Save the final generated itinerary to the database. Call this after building the complete itinerary.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID to save the itinerary for"),
          itinerary: ItinerarySchema.describe("Structured itinerary object"),
        }),
        execute: async (args: {
          eventId: string;
          itinerary: z.infer<typeof ItinerarySchema>;
        }) => {
          const { eventId, itinerary } = args;

          await prisma.event.update({
            where: { id: eventId },
            data: { itinerary: JSON.stringify(itinerary) },
          });

          const categoryTotals: Record<string, number> = {
            transport: 0,
            accommodation: 0,
            activities: 0,
            food: 0,
          };

          for (const day of itinerary.days) {
            for (const item of day.items) {
              const cat =
                item.type === "flight"
                  ? "transport"
                  : item.type === "hotel"
                  ? "accommodation"
                  : item.type === "activity"
                  ? "activities"
                  : item.type === "restaurant"
                  ? "food"
                  : "activities";
              categoryTotals[cat] =
                (categoryTotals[cat] || 0) + item.estimatedCost;
            }
          }

          for (const [category, estimated] of Object.entries(categoryTotals)) {
            if (estimated > 0) {
              const existing = await prisma.expense.findFirst({
                where: { eventId, category },
              });
              if (existing) {
                await prisma.expense.update({
                  where: { id: existing.id },
                  data: { estimated },
                });
              } else {
                await prisma.expense.create({
                  data: {
                    eventId,
                    category,
                    label:
                      category.charAt(0).toUpperCase() + category.slice(1),
                    estimated,
                  },
                });
              }
            }
          }

          return {
            success: true,
            message: "Itinerary saved successfully",
            totalCost: itinerary.totalEstimatedCost,
          };
        },
      },
    },
  });
}
