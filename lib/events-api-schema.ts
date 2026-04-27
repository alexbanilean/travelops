import { z } from "zod";

/** Shared body for POST /api/events and PATCH /api/events/[id] */
export const EventUpsertBodySchema = z.object({
  name: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  participants: z.number().int().positive().max(2000),
  budget: z.number().positive().optional().nullable(),
  preferences: z.string().max(5000).optional().nullable(),
});

export type EventUpsertBody = z.infer<typeof EventUpsertBodySchema>;
