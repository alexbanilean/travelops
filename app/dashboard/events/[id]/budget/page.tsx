"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { splitAgentStreamPayload } from "@/lib/agent-stream-protocol";
import { actorHeaders } from "@/lib/browser-actor";
import {
  ArrowLeft,
  Receipt,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Brain,
} from "lucide-react";

interface Expense {
  id: string;
  category: string;
  label: string;
  estimated: number;
  confirmed: number | null;
  lineAllocations?: string | null;
}

interface Event {
  id: string;
  name: string;
  destination: string;
  budget: number | null;
  expenses: Expense[];
  budgetReviewStale?: boolean;
  lastFinanceReviewAt?: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#6366f1",
  transport: "#3b82f6",
  food: "#f59e0b",
  activities: "#10b981",
  other: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: "Accommodation",
  transport: "Transport",
  food: "Food & Dining",
  activities: "Activities",
  other: "Other",
};

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamError, setStreamError] = useState("");
  const [agentDone, setAgentDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const fetchEvent = () => {
    fetch(`/api/events/${id}`, { headers: { ...actorHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      });
  };

  const markFinanceReviewed = async () => {
    await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...actorHeaders() },
      body: JSON.stringify({
        lastFinanceReviewAt: new Date().toISOString(),
        budgetReviewStale: false,
      }),
    });
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [streamText]);

  const runFinanceAgent = async () => {
    if (!event) return;
    setEstimating(true);
    setStreamText("");
    setStreamError("");
    setAgentDone(false);

    try {
      const res = await fetch("/api/agents/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...actorHeaders() },
        body: JSON.stringify({ eventId: event.id, action: "estimate" }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setStreamError(
          typeof errBody?.error === "string"
            ? errBody.error
            : "Request failed. Please try again."
        );
        setAgentDone(true);
        return;
      }

      if (!res.body) {
        setStreamError("No response body from server.");
        setAgentDone(true);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        const { displayText, streamError: err } =
          splitAgentStreamPayload(fullText);
        setStreamText(displayText);
        if (err) setStreamError(err);
      }

      const { displayText, streamError: finalErr } =
        splitAgentStreamPayload(fullText);
      setStreamText(displayText);
      if (finalErr) setStreamError(finalErr);
      setAgentDone(true);
      if (!finalErr) {
        await markFinanceReviewed();
        fetchEvent();
      }
    } catch (err) {
      console.error(err);
      setStreamError(
        err instanceof Error ? err.message : "Network error while analyzing."
      );
      setAgentDone(true);
    } finally {
      setEstimating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!event) return null;

  const totalEstimated = event.expenses.reduce((s, e) => s + e.estimated, 0);
  const totalConfirmed = event.expenses.reduce((s, e) => s + (e.confirmed || 0), 0);
  const remaining = event.budget ? event.budget - totalEstimated : null;
  const utilizationPct = event.budget ? (totalEstimated / event.budget) * 100 : 0;

  const pieData = event.expenses.map((e) => ({
    name: CATEGORY_LABELS[e.category] || e.category,
    value: e.estimated,
    category: e.category,
  }));

  const barData = event.expenses.map((e) => ({
    name: CATEGORY_LABELS[e.category] || e.category,
    Estimated: e.estimated,
    Confirmed: e.confirmed || 0,
  }));

  const isAtRisk = utilizationPct > 90 && utilizationPct <= 100;
  const isOverBudget = utilizationPct > 100;

  const needsFinanceRefresh =
    event.expenses.length === 0 ||
    event.budgetReviewStale === true ||
    !event.lastFinanceReviewAt;

  const financeLabel =
    event.expenses.length === 0
      ? "Estimate budget"
      : event.budgetReviewStale
        ? "Refresh finance review"
        : "Re-run narrative (optional)";

  return (
    <div>
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Budget</h1>
          <p className="text-muted-foreground mt-1">{event.name} · {event.destination}</p>
          {event.budgetReviewStale && event.expenses.length > 0 && (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Itinerary or invoices changed since the last finance pass — run a refresh to sync the narrative.
            </p>
          )}
        </div>
        <Button
          onClick={runFinanceAgent}
          disabled={estimating}
          variant={needsFinanceRefresh ? "default" : "outline"}
          className={
            needsFinanceRefresh
              ? "gap-2 bg-emerald-600 hover:bg-emerald-700"
              : "gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          }
        >
          {estimating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {financeLabel}
            </>
          )}
        </Button>
      </div>

      {/* Budget alerts */}
      {isOverBudget && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-100">
            <strong>Budget exceeded:</strong> Estimated costs (€{totalEstimated.toLocaleString()}) exceed the approved budget by €{(totalEstimated - (event.budget || 0)).toLocaleString()}.
          </AlertDescription>
        </Alert>
      )}
      {isAtRisk && !isOverBudget && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/35">
          <AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
          <AlertDescription className="text-yellow-900 dark:text-yellow-100">
            <strong>Budget at risk:</strong> You&apos;ve used {utilizationPct.toFixed(0)}% of your budget. Only €{remaining?.toLocaleString()} remaining.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total budget",
            value: event.budget ? `€${event.budget.toLocaleString()}` : "Not set",
            sub: "Approved",
            color: "text-primary",
          },
          {
            label: "Estimated spend",
            value: `€${totalEstimated.toLocaleString()}`,
            sub: `${utilizationPct.toFixed(0)}% of budget`,
            color: "text-indigo-600",
          },
          {
            label: "Confirmed spend",
            value: `€${totalConfirmed.toLocaleString()}`,
            sub: "From invoices",
            color: "text-purple-600",
          },
          {
            label: "Remaining",
            value: remaining !== null ? `€${remaining.toLocaleString()}` : "—",
            sub: remaining !== null && remaining < 0 ? "Over budget" : "Available",
            color: remaining !== null && remaining < 0 ? "text-red-600" : "text-emerald-600",
          },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} className="border border-border">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {event.expenses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No budget data yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Generate an itinerary first, then click &ldquo;Estimate budget&rdquo; to let the Finance Agent
            analyze costs.
          </p>
          <Button
            onClick={runFinanceAgent}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Estimate budget
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Budget utilization bar */}
          {event.budget && (
            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Budget utilization</h3>
                  <Badge
                    className={
                      isOverBudget
                        ? "bg-red-100 text-red-700"
                        : isAtRisk
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {isOverBudget ? "Over budget" : isAtRisk ? "At risk" : "On track"}
                  </Badge>
                </div>
                <Progress
                  value={Math.min(100, utilizationPct)}
                  className="h-3 mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>€0</span>
                  <span className="font-medium text-foreground">
                    €{totalEstimated.toLocaleString()} estimated
                  </span>
                  <span>€{event.budget.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Spend by category
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={CATEGORY_COLORS[entry.category] || "#6b7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`€${Number(value).toLocaleString()}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[entry.category] || "#6b7280" }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        €{entry.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  Estimated vs Confirmed
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                    <Tooltip
                      formatter={(value) => [`€${Number(value).toLocaleString()}`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="Estimated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Confirmed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown table */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Category breakdown</h3>
              <div className="space-y-3">
                {event.expenses.map((expense) => {
                  const pct = event.budget
                    ? (expense.estimated / event.budget) * 100
                    : 0;
                  return (
                    <div key={expense.id} className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[expense.category] || "#6b7280",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {CATEGORY_LABELS[expense.category] || expense.label}
                          </span>
                          <div className="text-sm text-foreground font-medium">
                            €{expense.estimated.toLocaleString()}
                            {expense.confirmed && expense.confirmed > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (€{expense.confirmed.toLocaleString()} confirmed)
                              </span>
                            )}
                          </div>
                        </div>
                        {event.budget && (
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                backgroundColor:
                                  CATEGORY_COLORS[expense.category] || "#6b7280",
                                opacity: 0.7,
                              }}
                            />
                          </div>
                        )}
                        {(() => {
                          if (!expense.lineAllocations) return null;
                          try {
                            const lines = JSON.parse(expense.lineAllocations) as Array<{
                              lineKey: string;
                              label: string;
                              amount: number;
                            }>;
                            if (!Array.isArray(lines) || lines.length === 0) return null;
                            return (
                              <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                                {lines.map((ln) => (
                                  <li key={ln.lineKey}>
                                    <span className="font-mono text-[10px]">{ln.lineKey}</span>{" "}
                                    {ln.label} — €{ln.amount.toLocaleString()}
                                  </li>
                                ))}
                              </ul>
                            );
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                      {event.budget && (
                        <span className="text-xs text-muted-foreground w-10 text-right flex-shrink-0">
                          {pct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="mt-10 space-y-6" aria-labelledby="budget-assist-heading">
        <div>
          <h2
            id="budget-assist-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Guidance & automation
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the assistant in the right rail (or the Assistant button on mobile) for budget questions,
            structured caps, and notes for the next itinerary run. Finance narrative appears below when you
            run the estimator.
          </p>
        </div>

        {(estimating || streamText || streamError) && (
          <Card className="border border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <Brain className="size-4 text-white" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">Finance Agent</div>
                  <div className="text-xs text-muted-foreground">Powered by Google Gemini</div>
                </div>
                {estimating && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <div className="size-2 animate-pulse rounded-full bg-emerald-600" aria-hidden />
                    Analyzing finances…
                  </div>
                )}
                {agentDone && !estimating && !streamError && (
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                    <CheckCircle className="size-4 shrink-0" aria-hidden />
                    Analysis complete
                  </div>
                )}
                {agentDone && !estimating && streamError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden />
                    Failed
                  </div>
                )}
              </div>
              {streamError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{streamError}</AlertDescription>
                </Alert>
              )}
              <div
                ref={chatRef}
                className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-background/80 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground dark:bg-background/50"
              >
                {streamText || (
                  <span className="italic text-muted-foreground">Initializing Finance Agent…</span>
                )}
                {estimating && (
                  <span
                    className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-emerald-600"
                    aria-hidden
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
