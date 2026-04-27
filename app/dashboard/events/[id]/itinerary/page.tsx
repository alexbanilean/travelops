"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { splitAgentStreamPayload } from "@/lib/agent-stream-protocol";
import {
  ArrowLeft,
  Brain,
  Plane,
  Hotel,
  Utensils,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Radar,
} from "lucide-react";
import { format } from "date-fns";
import { actorHeaders } from "@/lib/browser-actor";
import { parsePlanningConstraintsJson } from "@/lib/planning-constraints";
import { useAssistantUi } from "@/components/assistant-ui-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ItinerarySource {
  label: string;
  url: string;
}

interface ItineraryItem {
  id?: string;
  time: string;
  type: "flight" | "hotel" | "activity" | "restaurant" | "other";
  name: string;
  description: string;
  estimatedCost: number;
  vendor?: string;
  sources?: ItinerarySource[];
  priceQuotedAt?: string;
  offerExpiresAt?: string | null;
  dataProvenance?: string;
  pricingContextNote?: string;
  trackingUrl?: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  items: ItineraryItem[];
}

interface Itinerary {
  days: ItineraryDay[];
  totalEstimatedCost: number;
  summary: string;
  itineraryQuotedAt?: string;
  dataProvenance?: string;
  pricingTrustNote?: string;
}

interface Event {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: number;
  budget: number | null;
  preferences: string | null;
  itinerary: string | null;
  pendingPlanningNotes?: string | null;
  planningConstraintsJson?: string | null;
}

const typeIcon = {
  flight: Plane,
  hotel: Hotel,
  restaurant: Utensils,
  activity: Activity,
  other: Sparkles,
};

const typeColor = {
  flight: "bg-primary/15 text-primary",
  hotel: "bg-purple-100 text-purple-700",
  restaurant: "bg-orange-100 text-orange-700",
  activity: "bg-green-100 text-green-700",
  other: "bg-muted text-foreground",
};

function safeHttpUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function formatIsoUtc(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "MMM d, yyyy HH:mm") + " UTC";
}

function isOfferStale(iso?: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() > t;
}

function ToolCallBadge({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80;
  const display = isLong && !expanded ? text.slice(0, 80) + "…" : text;

  return (
    <div
      className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/15 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse flex-shrink-0" />
      <span className="font-mono">{display}</span>
      {isLong && (
        expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </div>
  );
}

function ItineraryItemCard({ item }: { item: ItineraryItem }) {
  const Icon = typeIcon[item.type] || Sparkles;
  const color = typeColor[item.type] || typeColor.other;
  const quotedLine = formatIsoUtc(item.priceQuotedAt);
  const expiresLine = formatIsoUtc(item.offerExpiresAt ?? undefined);
  const stale = isOfferStale(item.offerExpiresAt ?? undefined);
  const trackingHref = item.trackingUrl ? safeHttpUrl(item.trackingUrl) : null;

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border hover:border-border bg-card transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.time}</span>
              {stale && (
                <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-900">
                  Quote may be stale
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-foreground mt-0.5">{item.name}</h4>
            {item.vendor && (
              <span className="text-xs text-primary font-medium">{item.vendor}</span>
            )}
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
            {(quotedLine || expiresLine || item.pricingContextNote || item.dataProvenance) && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground leading-relaxed">
                {quotedLine && <p>Price snapshot: {quotedLine}</p>}
                {expiresLine && (
                  <p>
                    Suggested re-check after: {expiresLine}
                    {stale ? " — refresh prices before booking." : ""}
                  </p>
                )}
                {item.pricingContextNote && <p>{item.pricingContextNote}</p>}
                {item.dataProvenance && (
                  <p className="font-mono text-[11px] opacity-90">Source: {item.dataProvenance}</p>
                )}
              </div>
            )}
            {item.sources && item.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                {item.sources.map((s, idx) => {
                  const href = safeHttpUrl(s.url);
                  if (!href) return null;
                  return (
                    <a
                      key={`${href}-${idx}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{s.label || "Open link"}</span>
                    </a>
                  );
                })}
              </div>
            )}
            {trackingHref && (
              <a
                href={trackingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Radar className="w-3.5 h-3.5 shrink-0 opacity-80" />
                Track flight (opens FlightRadar24)
              </a>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-semibold text-foreground">€{item.estimatedCost.toLocaleString()}</div>
            <Badge variant="outline" className={`text-xs mt-1 ${color} border-0`}>
              {item.type}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseToolCalls(text: string): string[] {
  const calls: string[] = [];
  const toolRegex = /(?:Searching|Saving|Finding|Calling|Tool:|searching|saving|finding)\s+[^.!?\n]+/gi;
  const matches = text.match(toolRegex);
  if (matches) calls.push(...matches.slice(0, 8));
  return calls;
}

export default function ItineraryPage() {
  const { id } = useParams<{ id: string }>();
  const { setMobileRailOpen, requestRailComposerFocus, setRailCollapsed } = useAssistantUi();
  const [event, setEvent] = useState<Event | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [streamText, setStreamText] = useState("");
  const [streamError, setStreamError] = useState("");
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [streamFinished, setStreamFinished] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`, { headers: { ...actorHeaders() } })
      .then((r) => r.json())
      .then((data: Event) => {
        setEvent(data);
        if (data.itinerary) {
          try {
            setItinerary(JSON.parse(data.itinerary) as Itinerary);
          } catch (_e) {
            // ignore parse error
          }
        }
      });
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [streamText]);

  const generateItinerary = async () => {
    if (!event) return;
    setGenerating(true);
    setStreamText("");
    setStreamError("");
    setToolCalls([]);
    setStreamFinished(false);
    setItinerary(null);

    try {
      const res = await fetch("/api/agents/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...actorHeaders() },
        body: JSON.stringify({
          eventId: event.id,
          destination: event.destination,
          startDate: event.startDate,
          endDate: event.endDate,
          participants: event.participants,
          budget: event.budget,
          preferences: event.preferences,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setStreamError(
          typeof errBody?.error === "string"
            ? errBody.error
            : "Request failed. Please try again."
        );
        setStreamFinished(true);
        return;
      }

      if (!res.body) {
        setStreamError("No response body from server.");
        setStreamFinished(true);
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

        const newCalls = parseToolCalls(displayText);
        setToolCalls(newCalls);
      }

      const { displayText, streamError: finalErr } =
        splitAgentStreamPayload(fullText);
      setStreamText(displayText);
      if (finalErr) setStreamError(finalErr);
      setStreamFinished(true);

      if (!finalErr) {
        const updated = await fetch(`/api/events/${id}`, {
          headers: { ...actorHeaders() },
        }).then((r) => r.json());
        if (updated.itinerary) {
          try {
            setItinerary(JSON.parse(updated.itinerary) as Itinerary);
            setExpandedDays(new Set([1]));
            setEvent(updated as Event);
            void (async () => {
              try {
                const fin = await fetch("/api/agents/finance", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...actorHeaders() },
                  body: JSON.stringify({ eventId: id, action: "estimate" }),
                });
                if (!fin.ok || !fin.body) return;
                const reader = fin.body.getReader();
                const decoder = new TextDecoder();
                let buf = "";
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buf += decoder.decode(value, { stream: true });
                }
                const { streamError: finErr } = splitAgentStreamPayload(buf);
                if (finErr) return;
                await fetch(`/api/events/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", ...actorHeaders() },
                  body: JSON.stringify({
                    lastFinanceReviewAt: new Date().toISOString(),
                    budgetReviewStale: false,
                  }),
                });
              } catch {
                /* silent */
              }
            })();
          } catch (_e) {
            setStreamError(
              "The agent finished but the saved itinerary could not be loaded. Try refreshing the page."
            );
          }
        } else {
          setStreamError(
            "The agent did not save an itinerary (it may have stopped early or hit a limit). Try again or switch model in .env — see README."
          );
        }
      }
    } catch (err) {
      console.error(err);
      setStreamError(
        err instanceof Error ? err.message : "Network error while generating."
      );
      setStreamFinished(true);
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const structured = parsePlanningConstraintsJson(event.planningConstraintsJson);
  const hasStructured =
    structured != null &&
    (structured.maxTotal != null ||
      structured.savingsTargetPercent != null ||
      structured.maxActivitySpend != null);
  const hasQueuedPlanning =
    Boolean(event.pendingPlanningNotes?.trim()) || hasStructured;

  return (
    <div>
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      {hasQueuedPlanning && (
        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <p className="font-medium text-foreground">
                The next itinerary run will merge these inputs (and enforce them on save):
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
                {event.pendingPlanningNotes?.trim() && (
                  <li>
                    <span className="font-medium">Planner notes</span>
                    <div className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                      {event.pendingPlanningNotes}
                    </div>
                  </li>
                )}
                {structured?.maxTotal != null && (
                  <li>Structured max line-item total: €{structured.maxTotal.toLocaleString()}</li>
                )}
                {structured?.savingsTargetPercent != null && (
                  <li>Target savings vs approved budget: {structured.savingsTargetPercent}%</li>
                )}
                {structured?.maxActivitySpend != null && (
                  <li>Activities subtotal cap: €{structured.maxActivitySpend.toLocaleString()}</li>
                )}
              </ul>
            </div>
            <Tooltip>
              <TooltipTrigger
                delay={260}
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/40"
                    onClick={() => {
                      setRailCollapsed(false);
                      if (
                        typeof window !== "undefined" &&
                        window.matchMedia("(max-width: 1023px)").matches
                      ) {
                        setMobileRailOpen(true);
                      }
                      requestRailComposerFocus();
                    }}
                  />
                }
              >
                Open assistant
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Jump to the assistant with notes and caps in context
              </TooltipContent>
            </Tooltip>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Itinerary</h1>
          <p className="text-muted-foreground mt-1">{event.name} · {event.destination}</p>
        </div>
        <Tooltip>
          <TooltipTrigger
            delay={280}
            render={
              <Button
                onClick={generateItinerary}
                disabled={generating}
                className="bg-primary hover:bg-primary/90 gap-2"
              />
            }
          >
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Planning...
              </>
            ) : itinerary ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate itinerary
              </>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {itinerary
              ? "Run the planning agent again (merges queued notes and structured caps)"
              : "Generate a day-by-day itinerary from this event"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Agent stream panel */}
      {(generating || streamText || streamError) && (
        <Card className="border border-primary/25 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">Planning Agent</div>
                <div className="text-xs text-muted-foreground">Powered by Google Gemini</div>
              </div>
              {generating && (
                <div className="ml-auto flex items-center gap-2 text-xs text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Working...
                </div>
              )}
              {streamFinished && !generating && !streamError && (
                <div className="ml-auto flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </div>
              )}
              {streamFinished && !generating && streamError && (
                <div className="ml-auto flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4" />
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

            {toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {toolCalls.map((call, i) => (
                  <ToolCallBadge key={i} text={call} />
                ))}
              </div>
            )}

            <div
              ref={chatRef}
              className="max-h-48 overflow-y-auto bg-muted/50 rounded-lg p-4 text-sm text-foreground font-mono leading-relaxed whitespace-pre-wrap"
            >
              {streamText || (
                <span className="text-muted-foreground italic">Agent is initializing...</span>
              )}
              {generating && (
                <span className="inline-block w-2 h-4 bg-primary/100 ml-1 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itinerary display */}
      {itinerary ? (
        <div className="space-y-4">
          {/* Summary card */}
          <Card className="border-2 border-primary/15 bg-gradient-to-r from-primary/8 to-chart-4/10">
            <CardContent className="p-6">
              {(itinerary.pricingTrustNote || itinerary.itineraryQuotedAt) && (
                <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 [&>svg]:text-amber-800 dark:[&>svg]:text-amber-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm leading-relaxed">
                    {itinerary.pricingTrustNote && (
                      <span className="block">{itinerary.pricingTrustNote}</span>
                    )}
                    {itinerary.itineraryQuotedAt && formatIsoUtc(itinerary.itineraryQuotedAt) && (
                      <span className="mt-2 block text-xs opacity-90">
                        Itinerary saved at {formatIsoUtc(itinerary.itineraryQuotedAt)}.
                        {itinerary.dataProvenance && (
                          <> Data mode: <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">{itinerary.dataProvenance}</code>.</>
                        )}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground mb-1">Trip summary</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">{itinerary.summary}</p>
                  <p className="text-xs text-muted-foreground/90 max-w-2xl mt-3 leading-relaxed">
                    Line-item links open discovery pages (e.g. Google Flights, Hotels, Maps) tied to the search tools used to build this plan — use them to verify schedules, availability, and current pricing before booking.
                  </p>
                </div>
                <div className="text-right ml-6 flex-shrink-0">
                  <div className="text-xs text-muted-foreground mb-1">Total estimated</div>
                  <div className="text-3xl font-bold text-primary">
                    €{itinerary.totalEstimatedCost.toLocaleString()}
                  </div>
                  {event.budget && (
                    <div className={`text-sm font-medium mt-1 ${itinerary.totalEstimatedCost <= event.budget ? "text-green-600" : "text-red-600"}`}>
                      {itinerary.totalEstimatedCost <= event.budget
                        ? `€${(event.budget - itinerary.totalEstimatedCost).toLocaleString()} under budget ✓`
                        : `€${(itinerary.totalEstimatedCost - event.budget).toLocaleString()} over budget ⚠️`}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Day-by-day accordion */}
          {itinerary.days.map((day) => (
            <Card key={day.day} className="border border-border">
              <button
                onClick={() => toggleDay(day.day)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    D{day.day}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{day.title}</div>
                    <div className="text-sm text-muted-foreground">{day.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground">Day cost</div>
                    <div className="font-semibold text-foreground">
                      €{day.items.reduce((s, i) => s + i.estimatedCost, 0).toLocaleString()}
                    </div>
                  </div>
                  {expandedDays.has(day.day) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>
              {expandedDays.has(day.day) && (
                <CardContent className="px-6 pb-6 pt-0">
                  <div className="space-y-3">
                    {day.items.map((item, i) => (
                      <ItineraryItemCard key={i} item={item} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : !generating && !streamText && !streamError ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary/70" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No itinerary yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Click &ldquo;Generate itinerary&rdquo; to let the Planning Agent build a complete day-by-day
            schedule with transport, accommodation, activities and dining.
          </p>
          <Button
            onClick={generateItinerary}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate itinerary
          </Button>
        </div>
      ) : null}
    </div>
  );
}
