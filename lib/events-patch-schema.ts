import { z } from "zod";

const optionalCore = z.object({
  name: z.string().min(1).max(200).optional(),
  destination: z.string().min(1).max(200).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  participants: z.number().int().positive().max(2000).optional(),
  budget: z.number().positive().optional().nullable(),
  preferences: z.string().max(5000).optional().nullable(),
});

export const EventPatchBodySchema = optionalCore.extend({
  planningStatus: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED"]).optional(),
  approvedByName: z.string().max(200).optional().nullable(),
  pendingPlanningNotes: z.string().max(8000).optional().nullable(),
  budgetReviewStale: z.boolean().optional(),
  lastFinanceReviewAt: z.string().min(1).optional().nullable(),
});

export type EventPatchBody = z.infer<typeof EventPatchBodySchema>;
