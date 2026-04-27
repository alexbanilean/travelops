import { parsePlanningConstraintsJson } from "@/lib/planning-constraints";

export type EventQueuedFields = {
  pendingPlanningNotes?: string | null;
  planningConstraintsJson?: string | null;
};

export type QueuedPlanningContext = {
  active: boolean;
  /** Short labels for the collapsed row, e.g. "Notes · Structured caps" */
  summaryLine: string;
  /** Full text for the expandable panel (not part of the chat transcript). */
  detailText: string;
};

/**
 * Planning inputs saved on the event — surfaced in the assistant rail as a compact
 * **context strip**, not as chat messages.
 */
export function getQueuedPlanningContext(event: EventQueuedFields): QueuedPlanningContext {
  const notes = event.pendingPlanningNotes?.trim();
  const c = parsePlanningConstraintsJson(event.planningConstraintsJson);

  const detailParts: string[] = [];
  const summaryBits: string[] = [];

  if (notes) {
    summaryBits.push("Notes");
    detailParts.push(`Planner notes\n${notes}`);
  }

  if (c) {
    const lines: string[] = [];
    if (c.maxTotal != null) {
      lines.push(`Max line-item total: €${c.maxTotal.toLocaleString()}`);
    }
    if (c.savingsTargetPercent != null) {
      lines.push(`Savings target: ${c.savingsTargetPercent}% under approved budget`);
    }
    if (c.maxActivitySpend != null) {
      lines.push(`Activities cap: €${c.maxActivitySpend.toLocaleString()}`);
    }
    if (lines.length) {
      summaryBits.push("Structured caps");
      detailParts.push(`Structured caps (enforced on save)\n${lines.join("\n")}`);
    }
  }

  return {
    active: detailParts.length > 0,
    summaryLine: summaryBits.join(" · "),
    detailText: detailParts.join("\n\n—\n\n"),
  };
}
