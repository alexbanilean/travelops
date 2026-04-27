import { google } from "@ai-sdk/google";
import { streamText, stepCountIs, type ModelMessage } from "ai";
import { GEMINI_MODEL } from "@/lib/ai-model";
import {
  createGeminiPrepareStep,
  getGeminiEventAssistantMaxRetries,
} from "@/lib/gemini-rate-limit";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import {
  PlanningConstraintsSchema,
  formatConstraintsForPrompt,
  mergePlanningConstraintsJson,
  validateConstraintsAgainstBudget,
} from "@/lib/planning-constraints";

export type EventAssistantSurface =
  | "event-hub"
  | "event-budget"
  | "event-itinerary"
  | "dashboard";

const SYSTEM = `You are TravelOps Event Assistant — one persistent copilot for budget, planning constraints, and spend context.

## Behaviour
- Work in EUR. Be concise and actionable.
- You receive **conversation history** plus a **fresh event snapshot** in the system block each turn — use it; do not insist the user repeat event id, dates, or budget if it is already in the snapshot.
- When the user confirms ("yes", "go ahead", "regenerate") after you already summarized constraints, **acknowledge and stop re-asking** — they can run regeneration from the itinerary screen; you do not need to call getEventSnapshot again unless numbers may have changed.
- Use **getEventSnapshot** when you need current totals, stale flags, or to verify state before advising.
- For free-text planner instructions, call **setPendingPlanningNotes** with short imperative bullets the planning agent can follow.
- For numeric caps (max total, savings %, activity cap), call **mergePlanningConstraints** — these are validated against the approved budget and enforced on itinerary save.
- **clearQueuedPlanning** removes both pending notes and structured constraints when the user asks to reset.

## Guards (tell the user when violated)
- Structured **maxTotal** cannot exceed the approved finance budget.
- Trip dates in the snapshot are authoritative for itinerary day rows.`;

function formatEventSnapshotBlock(params: {
  surface: EventAssistantSurface;
  event: {
    id: string;
    name: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    budget: number | null;
    planningStatus: string;
    budgetReviewStale: boolean;
    pendingPlanningNotes: string | null;
    planningConstraintsJson: string | null;
    expenses: Array<{
      category: string;
      label: string;
      estimated: number;
      confirmed: number | null;
    }>;
    invoices: Array<{ id: string }>;
  };
}): string {
  const e = params.event;
  const start = e.startDate.toISOString().slice(0, 10);
  const end = e.endDate.toISOString().slice(0, 10);
  const totalEstimated = e.expenses.reduce((s, x) => s + x.estimated, 0);
  const totalConfirmed = e.expenses.reduce((s, x) => s + (x.confirmed || 0), 0);
  const structured = formatConstraintsForPrompt(e.planningConstraintsJson, null);
  return [
    `## Event snapshot (authoritative)`,
    `- surface: ${params.surface}`,
    `- id: ${e.id}`,
    `- name: ${e.name}`,
    `- destination: ${e.destination}`,
    `- dates: ${start} → ${end} (YYYY-MM-DD)`,
    `- approved budget: ${e.budget != null ? `€${e.budget}` : "not set"}`,
    `- planningStatus: ${e.planningStatus}`,
    `- budgetReviewStale: ${e.budgetReviewStale}`,
    `- pendingPlanningNotes: ${e.pendingPlanningNotes ? "(set — see below)" : "none"}`,
    e.pendingPlanningNotes
      ? `\n### pendingPlanningNotes\n${e.pendingPlanningNotes}`
      : "",
    structured ? `\n### Structured constraints (JSON-backed)\n${structured}` : "",
    `\n### Expenses (estimated / confirmed)`,
    `- line items: ${e.expenses.length}, invoices on file: ${e.invoices.length}`,
    `- sum estimated: €${totalEstimated}, sum confirmed: €${totalConfirmed}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createEventAssistantStream(params: {
  eventId: string;
  surface: EventAssistantSurface;
  messages: ModelMessage[];
  actorName: string;
}) {
  const serverEventId = params.eventId;

  return streamText({
    model: google(GEMINI_MODEL),
    system: SYSTEM,
    maxRetries: getGeminiEventAssistantMaxRetries(),
    prepareStep: createGeminiPrepareStep(),
    stopWhen: stepCountIs(10),
    messages: params.messages,
    tools: {
      getEventSnapshot: {
        description:
          "Load current budget, dates, planning notes, structured constraints, expense totals, invoice count.",
        inputSchema: z.object({
          reason: z.string().max(120).optional(),
        }),
        execute: async () => {
          const event = await prisma.event.findUnique({
            where: { id: serverEventId },
            include: { expenses: true, invoices: true },
          });
          if (!event) return { error: "Event not found" };
          return {
            snapshot: formatEventSnapshotBlock({
              surface: params.surface,
              event,
            }),
          };
        },
      },
      setPendingPlanningNotes: {
        description:
          "Store free-text notes merged into the next itinerary generation (planning agent).",
        inputSchema: z.object({
          notes: z.string().max(6000),
        }),
        execute: async (args: { notes: string }) => {
          await prisma.event.update({
            where: { id: serverEventId },
            data: { pendingPlanningNotes: args.notes.trim() || null },
          });
          await writeAuditLog({
            eventId: serverEventId,
            actorName: params.actorName,
            action: "PLANNING_NOTES_SET",
            payload: { length: args.notes.length },
          });
          return { success: true as const };
        },
      },
      mergePlanningConstraints: {
        description:
          "Merge structured caps (maxTotal, savingsTargetPercent, maxActivitySpend). Omitted fields keep previous values.",
        inputSchema: z.object({
          maxTotal: z.number().positive().optional(),
          savingsTargetPercent: z.number().min(0).max(95).optional(),
          maxActivitySpend: z.number().positive().optional(),
        }),
        execute: async (patch: {
          maxTotal?: number;
          savingsTargetPercent?: number;
          maxActivitySpend?: number;
        }) => {
          const event = await prisma.event.findUnique({
            where: { id: serverEventId },
            select: { budget: true, planningConstraintsJson: true },
          });
          if (!event) return { success: false as const, error: "Event not found" };
          const merged = mergePlanningConstraintsJson(
            event.planningConstraintsJson,
            patch
          );
          if (!merged.ok) {
            return { success: false as const, error: merged.error };
          }
          const parsed = PlanningConstraintsSchema.safeParse(JSON.parse(merged.json));
          if (!parsed.success) {
            return { success: false as const, error: parsed.error.message };
          }
          const constraintErr = validateConstraintsAgainstBudget(
            event.budget,
            parsed.data
          );
          if (constraintErr) {
            return { success: false as const, error: constraintErr };
          }
          const storeJson = merged.json === "{}" ? null : merged.json;
          await prisma.event.update({
            where: { id: serverEventId },
            data: { planningConstraintsJson: storeJson },
          });
          await writeAuditLog({
            eventId: serverEventId,
            actorName: params.actorName,
            action: "PLANNING_CONSTRAINTS_SET",
            payload: { keys: Object.keys(parsed.data) },
          });
          return { success: true as const, planningConstraintsJson: storeJson };
        },
      },
      clearQueuedPlanning: {
        description: "Clear pending planning notes and structured constraints.",
        inputSchema: z.object({
          reason: z.string().max(200).optional(),
        }),
        execute: async () => {
          await prisma.event.update({
            where: { id: serverEventId },
            data: {
              pendingPlanningNotes: null,
              planningConstraintsJson: null,
            },
          });
          await writeAuditLog({
            eventId: serverEventId,
            actorName: params.actorName,
            action: "PLANNING_QUEUE_CLEARED",
            payload: {},
          });
          return { success: true as const };
        },
      },
    },
  });
}

/** Prepend a fresh snapshot into the thread (merged into the first user turn to avoid back-to-back user roles). */
export async function buildEventAssistantMessages(params: {
  eventId: string;
  surface: EventAssistantSurface;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ModelMessage[]> {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: { expenses: true, invoices: true },
  });
  if (!event) {
    return [{ role: "user", content: "Event not found." }];
  }
  const snapshot = formatEventSnapshotBlock({ surface: params.surface, event });
  const history = params.history.map((m) => ({ ...m }));

  if (history.length === 0) {
    return [{ role: "user", content: snapshot }];
  }

  if (history[0].role === "user") {
    history[0] = {
      role: "user",
      content: `${snapshot}\n\n---\n\n${history[0].content}`,
    };
  } else {
    history.unshift({
      role: "user",
      content: `${snapshot}\n\n---\n\n(Continue after the assistant turn below.)`,
    });
  }

  return history as ModelMessage[];
}
