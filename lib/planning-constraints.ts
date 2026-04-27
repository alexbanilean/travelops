import { z } from "zod";

/** Structured caps the assistant can set; merged server-side (exported for agent tools). */
export const PlanningConstraintsSchema = z.object({
  maxTotal: z.number().positive().optional(),
  /** Percent under approved budget to target (e.g. 8 → aim for ≤ 92% of budget). */
  savingsTargetPercent: z.number().min(0).max(95).optional(),
  maxActivitySpend: z.number().positive().optional(),
});

export type PlanningConstraints = z.infer<typeof PlanningConstraintsSchema>;

const REDUCE_RE =
  /\b(reduce|lower|cheaper|cut|save|cap|budget[-\s]?friendly|economical|minimi[sz]e)\b/i;

export function notesImplySpendReduction(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  return REDUCE_RE.test(notes);
}

export function parsePlanningConstraintsJson(
  raw: string | null | undefined
): PlanningConstraints | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const r = PlanningConstraintsSchema.safeParse(parsed);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/**
 * Hard ceiling for line-item sum validation: min(approved budget, maxTotal, budget*(1-savings%)),
 * plus a default 5% slack under approved budget when notes ask for reduction but no structured cap exists.
 */
export function computeEffectiveBudgetCap(params: {
  approvedBudget: number | null | undefined;
  constraintsJson: string | null | undefined;
  pendingNotes: string | null | undefined;
}): number | undefined {
  const b = params.approvedBudget;
  if (b == null || b <= 0 || !Number.isFinite(b)) return undefined;

  const c = parsePlanningConstraintsJson(params.constraintsJson);
  let cap = b;

  if (c?.maxTotal != null && Number.isFinite(c.maxTotal)) {
    cap = Math.min(cap, c.maxTotal);
  }
  if (c?.savingsTargetPercent != null && c.savingsTargetPercent > 0) {
    cap = Math.min(cap, b * (1 - c.savingsTargetPercent / 100));
  }
  if (notesImplySpendReduction(params.pendingNotes) && cap >= b - 0.01) {
    cap = Math.min(cap, b * 0.95);
  }

  return Math.round(cap * 100) / 100;
}

/** Merge a partial patch into stored JSON; validates the combined object. */
export function mergePlanningConstraintsJson(
  currentJson: string | null | undefined,
  patch: Partial<PlanningConstraints>
): { ok: true; json: string } | { ok: false; error: string } {
  const base = parsePlanningConstraintsJson(currentJson) ?? {};
  const merged: Record<string, unknown> = { ...base };
  for (const key of ["maxTotal", "savingsTargetPercent", "maxActivitySpend"] as const) {
    if (patch[key] !== undefined) merged[key] = patch[key];
  }
  const r = PlanningConstraintsSchema.safeParse(merged);
  if (!r.success) {
    return { ok: false, error: r.error.message };
  }
  const keys = Object.keys(r.data);
  if (keys.length === 0) {
    return { ok: true, json: "{}" };
  }
  return { ok: true, json: JSON.stringify(r.data) };
}

export function validateConstraintsAgainstBudget(
  approvedBudget: number | null | undefined,
  constraints: PlanningConstraints
): string | null {
  const b = approvedBudget;
  if (b != null && b > 0 && constraints.maxTotal != null && constraints.maxTotal > b) {
    return `maxTotal (€${constraints.maxTotal}) cannot exceed the approved budget (€${b}).`;
  }
  return null;
}

export function formatConstraintsForPrompt(
  constraintsJson: string | null | undefined,
  pendingNotes: string | null | undefined
): string {
  const parts: string[] = [];
  const c = parsePlanningConstraintsJson(constraintsJson);
  if (c?.maxTotal != null) parts.push(`- Structured **maxTotal** (line-item sum): €${c.maxTotal}`);
  if (c?.savingsTargetPercent != null) {
    parts.push(
      `- Structured **savingsTargetPercent**: ${c.savingsTargetPercent}% under approved budget`
    );
  }
  if (c?.maxActivitySpend != null) {
    parts.push(`- Structured **maxActivitySpend** (activities subtotal): €${c.maxActivitySpend}`);
  }
  if (pendingNotes?.trim()) {
    parts.push(`- Planner notes:\n${pendingNotes.trim()}`);
  }
  return parts.length ? parts.join("\n") : "";
}
