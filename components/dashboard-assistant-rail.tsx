"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronLeft,
  History,
  PanelRightClose,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { splitAgentStreamPayload } from "@/lib/agent-stream-protocol";
import { actorHeaders } from "@/lib/browser-actor";
import type { EventAssistantSurface } from "@/lib/agents/event-assistant-agent";
import { useAssistantUi } from "@/components/assistant-ui-context";
import { cn } from "@/lib/utils";
import {
  getQueuedPlanningContext,
  type QueuedPlanningContext,
} from "@/lib/assistant-queued-summary";
import {
  assistantNewSession,
  assistantSelectSession,
  listAssistantSessionsSorted,
  loadAssistantSessionsState,
  loadAssistantThread,
  saveAssistantThread,
  type AssistantSessionsStateV1,
  type PersistedChatTurn,
} from "@/lib/assistant-thread-storage";

const ASSISTANT_STREAM_MAX_RETRIES = 3;

function isRetryableAssistantFailure(message: string): boolean {
  return /503|504|429|high demand|unavailable|try again later|overload|resource_exhausted|UNAVAILABLE|temporar/i.test(
    message
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function surfaceLabel(surface: EventAssistantSurface): string {
  switch (surface) {
    case "event-itinerary":
      return "Itinerary";
    case "event-budget":
      return "Budget";
    case "event-hub":
      return "Event";
    case "dashboard":
    default:
      return "Dashboard";
  }
}

function parseEventRoute(pathname: string): {
  eventId: string | null;
  surface: EventAssistantSurface;
} {
  const m = pathname.match(/^\/dashboard\/events\/([^/]+)(?:\/([^/]+))?/);
  if (!m) return { eventId: null, surface: "dashboard" };
  const id = m[1];
  const seg = m[2] ?? "";
  if (seg === "budget") return { eventId: id, surface: "event-budget" };
  if (seg === "itinerary") return { eventId: id, surface: "event-itinerary" };
  return { eventId: id, surface: "event-hub" };
}

function AssistantPanel({
  eventId,
  surface,
  focusComposerTick,
  onCollapseRail,
  className,
}: {
  eventId: string;
  surface: EventAssistantSurface;
  focusComposerTick: number;
  onCollapseRail?: () => void;
  className?: string;
}) {
  const [messages, setMessages] = useState<PersistedChatTurn[]>([]);
  const [queuedPanel, setQueuedPanel] = useState<QueuedPlanningContext | null>(null);
  const [threadReady, setThreadReady] = useState(false);
  const [sessionsRefresh, setSessionsRefresh] = useState(0);
  /** Session picker reads `localStorage` + UUIDs — defer until after mount to avoid SSR hydration mismatch. */
  const [sessionsUiReady, setSessionsUiReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ctxLabel = surfaceLabel(surface);

  const sessionState = useMemo((): AssistantSessionsStateV1 => {
    if (!sessionsUiReady) {
      return { activeSessionId: "", sessions: [] };
    }
    return loadAssistantSessionsState(eventId);
  }, [eventId, sessionsRefresh, sessionsUiReady]);

  const sessionsSorted = useMemo(() => {
    if (!sessionsUiReady) return [];
    return listAssistantSessionsSorted(eventId);
  }, [eventId, sessionsRefresh, sessionsUiReady]);

  useEffect(() => {
    setSessionsUiReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      setThreadReady(false);
      const res = await fetch(`/api/events/${eventId}`, { headers: { ...actorHeaders() } });
      if (!res.ok) {
        if (!cancelled) {
          setMessages(loadAssistantThread(eventId));
          setQueuedPanel(null);
          setSessionsRefresh((r) => r + 1);
          setThreadReady(true);
        }
        return;
      }
      if (cancelled) return;
      const event = (await res.json()) as {
        pendingPlanningNotes?: string | null;
        planningConstraintsJson?: string | null;
      };
      if (!cancelled) {
        setQueuedPanel(getQueuedPlanningContext(event));
        setMessages(loadAssistantThread(eventId));
        setSessionsRefresh((r) => r + 1);
        setThreadReady(true);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [focusComposerTick, eventId]);

  const persistTranscript = useCallback(
    (next: PersistedChatTurn[]) => {
      saveAssistantThread(eventId, next);
    },
    [eventId]
  );

  const handleSessionChange = useCallback(
    (value: string | null) => {
      if (value == null || busy) return;
      const active = loadAssistantSessionsState(eventId).activeSessionId;
      if (value === active) return;
      saveAssistantThread(eventId, messages);
      const next = assistantSelectSession(eventId, value);
      if (next) {
        setMessages(loadAssistantThread(eventId));
        setStreaming("");
        setErr("");
        setDraft("");
        setSessionsRefresh((r) => r + 1);
      }
    },
    [busy, eventId, messages]
  );

  const handleNewChat = useCallback(() => {
    if (busy) return;
    saveAssistantThread(eventId, messages);
    assistantNewSession(eventId);
    setMessages([]);
    setStreaming("");
    setErr("");
    setSessionsRefresh((r) => r + 1);
  }, [busy, eventId, messages]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setErr("");
    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setBusy(true);
    setStreaming("");

    try {
      let lastError = "Assistant request failed.";
      for (let attempt = 0; attempt < ASSISTANT_STREAM_MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          setStreaming(`Model busy — retrying (${attempt + 1}/${ASSISTANT_STREAM_MAX_RETRIES})…`);
          await sleep(700 * 2 ** (attempt - 1));
        }

        const res = await fetch("/api/agents/event-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...actorHeaders() },
          body: JSON.stringify({
            eventId,
            surface,
            messages: nextHistory,
          }),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          const msg =
            typeof j?.error === "string"
              ? j.error
              : typeof j?.error === "object" && j?.error != null && "message" in j.error
                ? String((j.error as { message?: unknown }).message)
                : "Assistant request failed.";
          lastError = msg;
          if (isRetryableAssistantFailure(msg) && attempt < ASSISTANT_STREAM_MAX_RETRIES - 1) {
            continue;
          }
          setErr(msg);
          return;
        }

        if (!res.body) {
          lastError = "No response body.";
          if (attempt < ASSISTANT_STREAM_MAX_RETRIES - 1) continue;
          setErr(lastError);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          const { displayText } = splitAgentStreamPayload(fullText);
          setStreaming(displayText);
        }

        const { displayText, streamError } = splitAgentStreamPayload(fullText);
        if (!streamError) {
          const reply = displayText.trim();
          setMessages((prev) => {
            const withReply: PersistedChatTurn[] = [
              ...prev,
              { role: "assistant", content: reply || "(No reply text.)" },
            ];
            persistTranscript(withReply);
            return withReply;
          });
          setSessionsRefresh((r) => r + 1);
          return;
        }

        lastError = streamError;
        if (isRetryableAssistantFailure(streamError) && attempt < ASSISTANT_STREAM_MAX_RETRIES - 1) {
          continue;
        }
        setErr(streamError);
        return;
      }

      setErr(lastError);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
      setStreaming("");
    }
  }, [busy, draft, eventId, messages, persistTranscript, surface]);

  return (
    <div
      className={cn(
        "flex min-h-0 max-h-full flex-1 flex-col overflow-hidden bg-card text-card-foreground",
        "rounded-none border-0 shadow-none",
        "lg:min-h-0 lg:max-h-full lg:flex-1 lg:bg-transparent",
        className
      )}
    >
      <header className="shrink-0 border-b border-border/40 bg-card/80 px-3 py-2.5 backdrop-blur-md sm:px-4">
        <div className="flex items-start gap-2.5">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/85 text-primary-foreground shadow-md ring-1 ring-primary/20 sm:size-11 sm:rounded-2xl"
            aria-hidden
          >
            <Sparkles className="size-[18px] sm:size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
                    TravelOps Assistant
                  </h2>
                  <Badge
                    variant="outline"
                    className="h-5 border-border/70 px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {ctxLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                  Gemini · grounded on this event&apos;s budget, dates, and spend
                </p>
              </div>
              {onCollapseRail ? (
                <Tooltip>
                  <TooltipTrigger
                    delay={220}
                    render={
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="size-8 shrink-0 cursor-pointer rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:size-9 sm:rounded-xl"
                        onClick={onCollapseRail}
                        aria-label="Collapse assistant panel"
                      />
                    }
                  >
                    <PanelRightClose className="size-4" aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent side="left">Collapse for more workspace</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!sessionsUiReady ? (
                <div
                  className="flex h-8 min-h-8 min-w-0 max-w-[min(100%,15rem)] flex-1 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2 text-xs text-muted-foreground shadow-sm"
                  aria-hidden
                >
                  <History className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">Chats</span>
                </div>
              ) : (
                <Select
                  value={sessionState.activeSessionId}
                  onValueChange={handleSessionChange}
                  disabled={busy}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-8 min-h-8 min-w-0 max-w-[min(100%,15rem)] flex-1 border-border/60 bg-background/90 text-left text-xs shadow-sm"
                    aria-label="Chat session history"
                  >
                    <History className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <SelectValue placeholder="Chats">
                      {(value: string | null) => {
                        if (!value) return "Chats";
                        const hit = sessionsSorted.find((s) => s.id === value);
                        return hit?.label ?? "Chat";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start" side="bottom" className="max-w-[min(22rem,92vw)]">
                    {sessionsSorted.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="cursor-pointer py-2.5 text-xs">
                        <span className="flex flex-col gap-0.5 text-left" title={s.title}>
                          <span className="line-clamp-2 font-medium text-foreground">{s.label}</span>
                          <span className="line-clamp-1 text-[10px] font-normal text-muted-foreground">
                            {s.messages.length} message{s.messages.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 shrink-0 cursor-pointer px-2.5 text-xs"
                disabled={busy}
                onClick={handleNewChat}
              >
                New chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      {queuedPanel?.active ? (
        <div className="shrink-0 border-b border-border/40 bg-muted/15 px-3 py-1 sm:px-4">
          <Accordion defaultValue={[]} className="w-full">
            <AccordionItem value="planning" className="border-0">
              <AccordionTrigger className="py-2 text-left text-xs font-medium text-muted-foreground hover:no-underline **:data-[slot=accordion-trigger-icon]:mt-0.5">
                <span className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                  <span
                    className="inline-flex size-1.5 shrink-0 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    Planning context · {queuedPanel.summaryLine}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-0">
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-xl border border-border/60 bg-background/90 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
                  {queuedPanel.detailText}
                </pre>
                <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                  Included automatically when you send a message — not shown as chat history.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 basis-0 space-y-3 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-4 sm:px-4"
        role="log"
        aria-live="polite"
      >
        {threadReady && messages.length === 0 && !streaming && !busy && (
          <div className="flex flex-col items-center justify-start px-2 py-8 text-center sm:py-10">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/50">
              <Bot className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Ask anything about this event</h3>
            <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-muted-foreground">
              Compare spend to budget, tighten caps, explain variances, or prep the next itinerary
              run — one thread, full context on every reply.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={cn(
              "max-w-[min(100%,30rem)] text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm"
                : "mr-auto rounded-2xl rounded-bl-md border border-border/50 bg-muted/35 px-3.5 py-2.5 text-foreground shadow-sm"
            )}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {(busy || streaming) && (
          <div className="mr-auto max-w-[min(100%,30rem)] rounded-2xl rounded-bl-md border border-border/50 bg-muted/35 px-3.5 py-2.5 text-sm text-foreground shadow-sm">
            <div className="flex items-start gap-2">
              <span className="mt-1.5 inline-flex size-2 shrink-0 rounded-full bg-primary/80 motion-safe:animate-pulse" />
              <div className="min-w-0 flex-1 whitespace-pre-wrap">
                {streaming || (
                  <span className="text-muted-foreground italic">Thinking…</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {err ? (
        <div
          className="shrink-0 border-t border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs leading-snug text-destructive sm:px-4"
          role="alert"
        >
          {err}
        </div>
      ) : null}

      <footer className="shrink-0 border-t border-border/50 bg-muted/20 p-3 backdrop-blur-sm sm:p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message the assistant…"
            rows={2}
            className="min-h-11 flex-1 resize-y rounded-xl border-border/70 bg-background text-sm shadow-sm"
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            aria-label="Message to assistant"
          />
          <Tooltip>
            <TooltipTrigger
              delay={240}
              render={
                <Button
                  type="button"
                  size="icon"
                  className="size-10 shrink-0 cursor-pointer rounded-full shadow-sm"
                  disabled={busy || !draft.trim()}
                  onClick={() => void send()}
                  aria-label="Send message"
                />
              }
            >
              <Send className="size-4" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="left">Send · Enter</TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for a new line
        </p>
      </footer>
    </div>
  );
}

function CollapsedRailStrip({
  hasEventContext,
  onExpand,
}: {
  hasEventContext: boolean;
  onExpand: () => void;
}) {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col items-center gap-4 border-0 bg-linear-to-b from-card via-card to-muted/25 py-4"
      role="region"
      aria-label="Assistant collapsed"
    >
      <Tooltip>
        <TooltipTrigger
          delay={220}
          render={
            <Button
              type="button"
              size="icon"
              variant="default"
              className="size-11 cursor-pointer rounded-xl shadow-md transition-transform duration-200 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
              onClick={onExpand}
              aria-label="Expand assistant"
            />
          }
        >
          <ChevronLeft className="size-5" aria-hidden />
        </TooltipTrigger>
        <TooltipContent side="left">Expand assistant</TooltipContent>
      </Tooltip>
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            delay={260}
            render={
              <span
                tabIndex={0}
                className="flex size-9 cursor-default items-center justify-center rounded-lg bg-muted/80 text-muted-foreground ring-1 ring-border/60 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            }
          >
            <Sparkles className="size-4" aria-hidden />
          </TooltipTrigger>
          <TooltipContent side="left">
            {hasEventContext
              ? "Event context active on this route"
              : "Open an event for full assistant context"}
          </TooltipContent>
        </Tooltip>
        {hasEventContext ? (
          <span
            className="size-2 rounded-full bg-primary ring-4 ring-primary/20"
            aria-label="Event context active"
          />
        ) : (
          <span className="size-2 rounded-full bg-muted-foreground/25" aria-hidden />
        )}
      </div>
      <div className="min-h-0 flex-1" aria-hidden />
    </div>
  );
}

export function DashboardAssistantRail() {
  const pathname = usePathname();
  const { eventId, surface } = useMemo(() => parseEventRoute(pathname), [pathname]);
  const {
    mobileRailOpen,
    setMobileRailOpen,
    focusComposerTick,
    railCollapsed,
    toggleRailCollapsed,
    setRailCollapsed,
  } = useAssistantUi();

  const placeholder = (
    <div className="flex flex-col items-center gap-3 px-2 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60">
        <Sparkles className="size-7 text-muted-foreground/70" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">No event selected</p>
        <p className="mt-1 max-w-60 text-xs leading-relaxed text-muted-foreground">
          Open an event from the dashboard to chat with budget, itinerary, and live spend context.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "hidden min-h-0 w-full min-w-0 flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-hidden",
          "lg:border-l lg:border-border/50 lg:bg-linear-to-b lg:from-card lg:via-card/95 lg:to-muted/25"
        )}
      >
        {railCollapsed ? (
          <CollapsedRailStrip
            hasEventContext={Boolean(eventId)}
            onExpand={() => setRailCollapsed(false)}
          />
        ) : eventId ? (
          <AssistantPanel
            key={eventId}
            eventId={eventId}
            surface={surface}
            focusComposerTick={focusComposerTick}
            onCollapseRail={toggleRailCollapsed}
          />
        ) : (
          <div className="flex min-h-0 max-h-full flex-1 flex-col overflow-hidden border-0 bg-card lg:bg-transparent">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6">
              {placeholder}
            </div>
            <div className="shrink-0 border-t border-border/60 bg-muted/20 px-3 py-2">
              <Tooltip>
                <TooltipTrigger
                  delay={220}
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                      onClick={toggleRailCollapsed}
                    />
                  }
                >
                  <PanelRightClose className="mr-2 size-3.5" aria-hidden />
                  Collapse panel
                </TooltipTrigger>
                <TooltipContent side="left">Hide assistant column</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden">
        <Tooltip>
          <TooltipTrigger
            delay={200}
            render={
              <Button
                type="button"
                size="sm"
                variant="default"
                className="fixed bottom-5 right-4 z-50 cursor-pointer gap-2 rounded-full px-4 shadow-lg ring-1 ring-primary/20"
                onClick={() => setMobileRailOpen(true)}
              />
            }
          >
            <Sparkles className="size-4" aria-hidden />
            Assistant
          </TooltipTrigger>
          <TooltipContent side="left">Open assistant</TooltipContent>
        </Tooltip>
        <Dialog open={mobileRailOpen} onOpenChange={setMobileRailOpen}>
          <DialogContent
            className="flex max-h-[min(90dvh,680px)] w-[min(100%-1.25rem,26rem)] flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-xl sm:max-w-md"
            showCloseButton
          >
            <DialogHeader className="sr-only">
              <DialogTitle>TravelOps assistant</DialogTitle>
            </DialogHeader>
            {eventId ? (
              <AssistantPanel
                key={eventId}
                eventId={eventId}
                surface={surface}
                focusComposerTick={focusComposerTick}
                className="max-h-[min(90dvh,680px)] min-h-0 flex-1 rounded-none border-0 shadow-none"
              />
            ) : (
              <div className="flex min-h-[240px] flex-1 flex-col border-b border-border/60 bg-muted/15 p-6">
                {placeholder}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
