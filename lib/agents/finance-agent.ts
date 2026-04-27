import { google } from "@ai-sdk/google";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { extractInvoiceData } from "@/lib/tools/extract-invoice";
import path from "path";

export const FINANCE_SYSTEM_PROMPT = `You are TravelOps Finance Agent, a corporate finance controller AI for managing travel and event budgets.

Your role is to provide precise financial analysis and budget management for corporate events. You can:

1. Calculate budget breakdowns by category
2. Compare spending against approved budgets
3. Process uploaded invoices using OCR
4. Record and track expenses
5. Flag budget overruns and risks

Always present financial data clearly with:
- Category breakdown (accommodation, transport, food, activities)
- Estimated vs confirmed costs
- Budget utilization percentages
- Clear warnings when categories exceed 90% of budget allocation
- Actionable recommendations for cost optimization

Be precise with numbers. Always work in EUR.`;

export function createFinanceAgentStream(params: {
  eventId: string;
  action: "estimate" | "summary" | "processInvoice";
  invoiceId?: string;
}) {
  const prompts: Record<string, string> = {
    estimate: `Calculate a comprehensive budget breakdown for event ID: ${params.eventId}. 
    Get the budget summary, calculate the breakdown by category, and compare with the approved budget. 
    Provide recommendations if any categories are over budget.`,
    summary: `Provide a detailed financial summary for event ID: ${params.eventId}. 
    Include all expenses (estimated and confirmed), budget utilization, and any alerts.`,
    processInvoice: `Process and extract data from invoice ID: ${params.invoiceId} for event ID: ${params.eventId}. 
    After extracting the data, record it as a confirmed expense and update the budget summary.`,
  };

  return streamText({
    model: google("gemini-2.0-flash"),
    system: FINANCE_SYSTEM_PROMPT,
    stopWhen: stepCountIs(6),
    prompt: prompts[params.action],
    tools: {
      getBudgetSummary: {
        description:
          "Get the complete budget summary for an event including all expenses and budget totals.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID"),
        }),
        execute: async (args: { eventId: string }) => {
          const event = await prisma.event.findUnique({
            where: { id: args.eventId },
            include: { expenses: true, invoices: true },
          });

          if (!event) return { error: "Event not found" };

          const totalEstimated = event.expenses.reduce(
            (sum, e) => sum + e.estimated,
            0
          );
          const totalConfirmed = event.expenses.reduce(
            (sum, e) => sum + (e.confirmed || 0),
            0
          );

          return {
            eventName: event.name,
            destination: event.destination,
            budget: event.budget,
            totalEstimated,
            totalConfirmed,
            remaining: event.budget ? event.budget - totalEstimated : null,
            expenses: event.expenses,
            invoiceCount: event.invoices.length,
          };
        },
      },
      calculateBudgetBreakdown: {
        description:
          "Calculate detailed budget breakdown by category for an event.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID"),
        }),
        execute: async (args: { eventId: string }) => {
          const expenses = await prisma.expense.findMany({
            where: { eventId: args.eventId },
          });

          const breakdown = expenses.reduce(
            (acc, expense) => {
              if (!acc[expense.category]) {
                acc[expense.category] = { estimated: 0, confirmed: 0 };
              }
              acc[expense.category].estimated += expense.estimated;
              acc[expense.category].confirmed += expense.confirmed || 0;
              return acc;
            },
            {} as Record<string, { estimated: number; confirmed: number }>
          );

          const total = {
            estimated: Object.values(breakdown).reduce(
              (s, c) => s + c.estimated,
              0
            ),
            confirmed: Object.values(breakdown).reduce(
              (s, c) => s + c.confirmed,
              0
            ),
          };

          return { breakdown, total };
        },
      },
      compareWithBudget: {
        description:
          "Compare current spending with the approved budget and flag overspending risks.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID"),
        }),
        execute: async (args: { eventId: string }) => {
          const event = await prisma.event.findUnique({
            where: { id: args.eventId },
            include: { expenses: true },
          });

          if (!event) return { error: "Event not found" };

          const totalEstimated = event.expenses.reduce(
            (s, e) => s + e.estimated,
            0
          );
          const alerts: string[] = [];

          if (event.budget) {
            const utilization = (totalEstimated / event.budget) * 100;
            if (utilization > 100) {
              alerts.push(
                `CRITICAL: Total estimated cost (€${totalEstimated.toFixed(0)}) exceeds budget by €${(totalEstimated - event.budget).toFixed(0)}`
              );
            } else if (utilization > 90) {
              alerts.push(
                `WARNING: Total spending at ${utilization.toFixed(1)}% of budget. Only €${(event.budget - totalEstimated).toFixed(0)} remaining.`
              );
            }

            return {
              budget: event.budget,
              totalEstimated,
              utilization: utilization.toFixed(1) + "%",
              remaining: event.budget - totalEstimated,
              status:
                utilization > 100
                  ? "over_budget"
                  : utilization > 90
                  ? "at_risk"
                  : "on_track",
              alerts,
            };
          }

          return {
            budget: null,
            totalEstimated,
            message: "No budget set for this event",
            alerts: [],
          };
        },
      },
      processInvoice: {
        description:
          "Process an uploaded invoice using OCR to extract vendor, amount, category and date.",
        inputSchema: z.object({
          invoiceId: z.string().describe("The invoice ID to process"),
        }),
        execute: async (args: { invoiceId: string }) => {
          const invoice = await prisma.invoice.findUnique({
            where: { id: args.invoiceId },
          });

          if (!invoice) return { error: "Invoice not found" };

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, invoice.filename);

          const extracted = await extractInvoiceData(filePath);

          if (!extracted) {
            return { error: "Could not extract data from invoice" };
          }

          await prisma.invoice.update({
            where: { id: args.invoiceId },
            data: {
              vendor: extracted.vendor,
              amount: extracted.amount,
              category: extracted.category,
              date: extracted.date,
              rawData: JSON.stringify(extracted),
            },
          });

          return {
            success: true,
            extracted: {
              vendor: extracted.vendor,
              amount: extracted.amount,
              category: extracted.category,
              date: extracted.date,
            },
          };
        },
      },
      recordExpense: {
        description:
          "Record or update an expense entry for an event. Use confirmed for actual invoiced amounts.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID"),
          category: z
            .enum(["accommodation", "transport", "food", "activities", "other"])
            .describe("Expense category"),
          label: z.string().describe("Human-readable label for this expense"),
          estimated: z.number().describe("Estimated amount in EUR"),
          confirmed: z
            .number()
            .optional()
            .describe("Confirmed/actual amount in EUR (from invoice)"),
        }),
        execute: async (args: {
          eventId: string;
          category:
            | "accommodation"
            | "transport"
            | "food"
            | "activities"
            | "other";
          label: string;
          estimated: number;
          confirmed?: number;
        }) => {
          const existing = await prisma.expense.findFirst({
            where: { eventId: args.eventId, category: args.category },
          });

          if (existing) {
            const updated = await prisma.expense.update({
              where: { id: existing.id },
              data: { estimated: args.estimated, confirmed: args.confirmed },
            });
            return { action: "updated", expense: updated };
          }

          const created = await prisma.expense.create({
            data: {
              eventId: args.eventId,
              category: args.category,
              label: args.label,
              estimated: args.estimated,
              confirmed: args.confirmed,
            },
          });
          return { action: "created", expense: created };
        },
      },
    },
  });
}
