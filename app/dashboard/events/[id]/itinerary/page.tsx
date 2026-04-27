"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface ItineraryItem {
  time: string;
  type: "flight" | "hotel" | "activity" | "restaurant" | "other";
  name: string;
  description: string;
  estimatedCost: number;
  vendor?: string;
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
}

const typeIcon = {
  flight: Plane,
  hotel: Hotel,
  restaurant: Utensils,
  activity: Activity,
  other: Sparkles,
};

const typeColor = {
  flight: "bg-blue-100 text-blue-700",
  hotel: "bg-purple-100 text-purple-700",
  restaurant: "bg-orange-100 text-orange-700",
  activity: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

function ToolCallBadge({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80;
  const display = isLong && !expanded ? text.slice(0, 80) + "…" : text;

  return (
    <div
      className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
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

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{item.time}</span>
            </div>
            <h4 className="font-semibold text-gray-900 mt-0.5">{item.name}</h4>
            {item.vendor && (
              <span className="text-xs text-blue-600 font-medium">{item.vendor}</span>
            )}
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-semibold text-gray-900">€{item.estimatedCost.toLocaleString()}</div>
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
  const [event, setEvent] = useState<Event | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [streamText, setStreamText] = useState("");
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
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
    setToolCalls([]);
    setDone(false);
    setItinerary(null);

    try {
      const res = await fetch("/api/agents/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamText(fullText);

        const newCalls = parseToolCalls(fullText);
        setToolCalls(newCalls);
      }

      setDone(true);

      // Reload event to get saved itinerary
      const updated = await fetch(`/api/events/${id}`).then((r) => r.json());
      if (updated.itinerary) {
        try {
          setItinerary(JSON.parse(updated.itinerary) as Itinerary);
          setExpandedDays(new Set([1]));
        } catch (_e) {
          // ignore parse error
        }
      }
    } catch (err) {
      console.error(err);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Itinerary</h1>
          <p className="text-gray-500 mt-1">{event.name} · {event.destination}</p>
        </div>
        <Button
          onClick={generateItinerary}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Planning...
            </>
          ) : itinerary ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate itinerary
            </>
          )}
        </Button>
      </div>

      {/* Agent stream panel */}
      {(generating || streamText) && (
        <Card className="border border-blue-100 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Planning Agent</div>
                <div className="text-xs text-gray-500">Powered by Gemini 2.0 Flash</div>
              </div>
              {generating && (
                <div className="ml-auto flex items-center gap-2 text-xs text-blue-600">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Working...
                </div>
              )}
              {done && !generating && (
                <div className="ml-auto flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </div>
              )}
            </div>

            {toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {toolCalls.map((call, i) => (
                  <ToolCallBadge key={i} text={call} />
                ))}
              </div>
            )}

            <div
              ref={chatRef}
              className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-4 text-sm text-gray-700 font-mono leading-relaxed whitespace-pre-wrap"
            >
              {streamText || (
                <span className="text-gray-400 italic">Agent is initializing...</span>
              )}
              {generating && (
                <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itinerary display */}
      {itinerary ? (
        <div className="space-y-4">
          {/* Summary card */}
          <Card className="border-2 border-blue-50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 mb-1">Trip summary</h2>
                  <p className="text-sm text-gray-600 max-w-2xl">{itinerary.summary}</p>
                </div>
                <div className="text-right ml-6 flex-shrink-0">
                  <div className="text-xs text-gray-500 mb-1">Total estimated</div>
                  <div className="text-3xl font-bold text-blue-600">
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
            <Card key={day.day} className="border border-gray-100">
              <button
                onClick={() => toggleDay(day.day)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    D{day.day}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{day.title}</div>
                    <div className="text-sm text-gray-500">{day.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500">Day cost</div>
                    <div className="font-semibold text-gray-900">
                      €{day.items.reduce((s, i) => s + i.estimatedCost, 0).toLocaleString()}
                    </div>
                  </div>
                  {expandedDays.has(day.day) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
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
      ) : !generating && !streamText ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No itinerary yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Click "Generate itinerary" to let the Planning Agent build a complete day-by-day schedule with transport, accommodation, activities and dining.
          </p>
          <Button
            onClick={generateItinerary}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate itinerary
          </Button>
        </div>
      ) : null}
    </div>
  );
}
