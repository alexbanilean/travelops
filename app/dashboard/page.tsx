"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  Plane,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { actorHeaders } from "@/lib/browser-actor";

interface Event {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: number;
  budget: number | null;
  expenses: { estimated: number; confirmed: number | null }[];
  invoices: unknown[];
}

function getBudgetStatus(event: Event) {
  if (!event.budget || event.expenses.length === 0) return null;
  const totalEstimated = event.expenses.reduce((s, e) => s + e.estimated, 0);
  const pct = (totalEstimated / event.budget) * 100;
  if (pct > 100) return { label: "Over budget", variant: "destructive" as const };
  if (pct > 90) return { label: "At risk", variant: "secondary" as const };
  return { label: `${pct.toFixed(0)}% used`, variant: "outline" as const };
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { ...actorHeaders() },
      });
      if (!res.ok) return;
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch("/api/events", { headers: { ...actorHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Manage your corporate trips and events</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" />
            New event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-primary/70" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6">Create your first corporate event and let AI handle the planning.</p>
          <Link href="/dashboard/events/new">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Create your first event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const budgetStatus = getBudgetStatus(event);
            const totalEstimated = event.expenses.reduce((s, e) => s + e.estimated, 0);

            return (
              <Card key={event.id} className="border border-border hover:border-primary/35 hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    {budgetStatus && (
                      <Badge variant={budgetStatus.variant} className="text-xs">
                        {budgetStatus.label}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-1">
                    {event.name}
                  </h3>
                  <p className="text-primary font-medium text-sm mb-4">
                    {event.destination}
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(event.startDate), "MMM d")} –{" "}
                      {format(new Date(event.endDate), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {event.participants} participants
                    </div>
                  </div>
                  {event.budget && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget usage</span>
                        <span>€{totalEstimated.toLocaleString()} / €{event.budget.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            totalEstimated > event.budget
                              ? "bg-red-500"
                              : totalEstimated / event.budget > 0.9
                              ? "bg-yellow-500"
                              : "bg-primary/100"
                          }`}
                          style={{
                            width: `${Math.min(100, (totalEstimated / event.budget) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Link href={`/dashboard/events/${event.id}`} className="w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group-hover:bg-primary/10 gap-2"
                      >
                        Open event
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/events/${event.id}/edit`} className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget({ id: event.id, name: event.name });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Permanently remove{" "}
                  <span className="font-medium text-foreground">{deleteTarget.name}</span> and all
                  related data. This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
