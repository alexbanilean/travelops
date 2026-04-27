"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Wallet,
  Brain,
  Receipt,
  BarChart3,
  ArrowRight,
  Pencil,
  Trash2,
  Download,
  History,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { actorHeaders, getActorNameFromStorage } from "@/lib/browser-actor";

interface EventComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
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
  planningStatus?: string;
  approvedAt?: string | null;
  approvedByName?: string | null;
  budgetReviewStale?: boolean;
  pendingPlanningNotes?: string | null;
  expenses: { id: string; category: string; estimated: number; confirmed: number | null }[];
  invoices: { id: string; vendor: string | null; amount: number | null }[];
  comments?: EventComment[];
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const reloadEvent = () => {
    fetch(`/api/events/${id}`, { headers: { ...actorHeaders() } })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => setEvent(data))
      .catch(() => setEvent(null));
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${id}`, { headers: { ...actorHeaders() } })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setEvent(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvent(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const approvePlan = async () => {
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...actorHeaders() },
      body: JSON.stringify({
        planningStatus: "APPROVED",
        approvedByName: getActorNameFromStorage(),
      }),
    });
    if (res.ok) reloadEvent();
  };

  const submitComment = async () => {
    const t = commentText.trim();
    if (!t) return;
    setCommentBusy(true);
    try {
      const res = await fetch(`/api/events/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...actorHeaders() },
        body: JSON.stringify({
          body: t,
          authorName: getActorNameFromStorage(),
        }),
      });
      if (res.ok) {
        setCommentText("");
        reloadEvent();
      }
    } finally {
      setCommentBusy(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { ...actorHeaders() },
      });
      if (!res.ok) return;
      setDeleteOpen(false);
      router.push("/dashboard");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!event || "error" in (event as object)) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Event not found</p>
        <Link href="/dashboard">
          <Button variant="ghost" className="mt-4">Back to events</Button>
        </Link>
      </div>
    );
  }

  const totalEstimated = event.expenses.reduce((s, e) => s + e.estimated, 0);
  const totalConfirmed = event.expenses.reduce((s, e) => s + (e.confirmed || 0), 0);
  const remaining = event.budget ? event.budget - totalEstimated : null;
  const hasItinerary = !!event.itinerary;
  const status = event.planningStatus ?? "DRAFT";
  const nights = Math.round(
    (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        All events
      </Link>

      {/* Header */}
      <div className="mb-8 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{event.name}</h1>
            <div className="mt-2 flex items-center gap-2 font-medium text-primary">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{event.destination}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Event status">
              {hasItinerary ? (
                <Badge className="border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
                  Itinerary ready
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Pending planning
                </Badge>
              )}
              {status === "APPROVED" ? (
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
                  Approved
                </Badge>
              ) : status === "PENDING_REVIEW" ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  Pending review
                </Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
              {event.budgetReviewStale && (
                <Badge variant="outline" className="border-orange-300 text-orange-900 dark:border-orange-800 dark:text-orange-200">
                  Finance review needed
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
            <Link href={`/dashboard/events/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          </div>
        </div>

        <Card className="border border-border bg-card/60 shadow-none dark:bg-card/40">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workflow
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/dashboard/events/${id}/activity`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <History className="size-4" aria-hidden />
                    Activity & versions
                  </Button>
                </Link>
                {hasItinerary && status !== "APPROVED" && (
                  <Button
                    size="sm"
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={approvePlan}
                  >
                    Approve plan
                  </Button>
                )}
              </div>
            </div>
            {hasItinerary && (
              <>
                <div className="h-px bg-border" role="separator" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Export itinerary
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    CSV for spreadsheets · ICS for calendar apps · HTML to print or save as PDF from the browser.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`/api/events/${id}/export/csv`}
                      download
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex min-h-7 items-center gap-2"
                      )}
                      aria-label="Download itinerary as CSV"
                    >
                      <Download className="size-4 shrink-0" aria-hidden />
                      CSV
                    </a>
                    <a
                      href={`/api/events/${id}/export/ics`}
                      download
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex min-h-7 items-center gap-2"
                      )}
                      aria-label="Download itinerary as ICS calendar file"
                    >
                      <Download className="size-4 shrink-0" aria-hidden />
                      Calendar (.ics)
                    </a>
                    <a
                      href={`/api/events/${id}/export/html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex min-h-7 items-center gap-2"
                      )}
                      aria-label="Open printable itinerary HTML in a new tab"
                    >
                      <Download className="size-4 shrink-0" aria-hidden />
                      Printable HTML
                    </a>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {event.pendingPlanningNotes && (
          <Card className="border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/35">
            <CardContent className="p-4 text-sm text-amber-950 dark:text-amber-50">
              <strong>Queued for next regeneration</strong>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{event.pendingPlanningNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              icon: Calendar,
              label: "Duration",
              value: `${nights} night${nights !== 1 ? "s" : ""}`,
              sub: `${format(new Date(event.startDate), "MMM d")} – ${format(new Date(event.endDate), "MMM d, yyyy")}`,
            },
            {
              icon: Users,
              label: "Participants",
              value: event.participants.toString(),
              sub: "team members",
            },
            {
              icon: Wallet,
              label: "Budget",
              value: event.budget ? `€${event.budget.toLocaleString()}` : "Not set",
              sub: remaining !== null ? `€${remaining.toLocaleString()} remaining` : "No budget",
            },
            {
              icon: BarChart3,
              label: "Estimated spend",
              value: totalEstimated > 0 ? `€${totalEstimated.toLocaleString()}` : "—",
              sub: totalConfirmed > 0 ? `€${totalConfirmed.toLocaleString()} confirmed` : "Not estimated yet",
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <Card key={label} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <div className="font-bold text-foreground text-lg">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href={`/dashboard/events/${id}/itinerary`} className="group">
          <Card className="border border-border hover:border-primary/35 hover:shadow-md transition-all h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Itinerary</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {hasItinerary
                  ? "View and manage the AI-generated day-by-day itinerary."
                  : "Generate a complete day-by-day itinerary with the Planning Agent."}
              </p>
              <div className="flex items-center gap-1 text-sm text-primary font-medium">
                {hasItinerary ? "View itinerary" : "Generate itinerary"}
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/events/${id}/budget`} className="group">
          <Card className="border border-border hover:border-emerald-200 hover:shadow-md transition-all h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Budget</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Real-time budget tracking with category breakdown and spending alerts.
              </p>
              <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                View budget
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/events/${id}/invoices`} className="group">
          <Card className="border border-border hover:border-purple-200 hover:shadow-md transition-all h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Invoices</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Upload invoices for AI-powered OCR extraction. {event.invoices.length > 0 && `${event.invoices.length} invoice${event.invoices.length !== 1 ? "s" : ""} uploaded.`}
              </p>
              <div className="flex items-center gap-1 text-sm text-purple-600 font-medium">
                Manage invoices
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="mt-8 border border-border">
        <CardContent className="p-6">
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-foreground">
            <MessageSquare className="size-4 text-primary" aria-hidden />
            Team comments
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Notes for planners and finance. Shown after itinerary, budget, and invoices so workstreams stay first.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave feedback for finance or planning…"
              rows={3}
              className="min-h-[88px] flex-1 resize-y"
              aria-label="Comment text"
            />
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto sm:self-stretch"
              disabled={commentBusy || !commentText.trim()}
              onClick={submitComment}
            >
              {commentBusy ? "Posting…" : "Post comment"}
            </Button>
          </div>
          {event.comments && event.comments.length > 0 && (
            <ul className="mt-6 space-y-4 border-t border-border pt-6">
              {event.comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-foreground">{c.authorName}</span>
                    <time
                      className="text-xs text-muted-foreground tabular-nums"
                      dateTime={c.createdAt}
                    >
                      {format(new Date(c.createdAt), "MMM d, yyyy · HH:mm")}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {event.preferences && (
        <Card className="border border-border mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground text-sm mb-2">Event preferences</h3>
            <p className="text-muted-foreground text-sm">{event.preferences}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">{event.name}</span>, its itinerary,
              expenses, and invoices. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
