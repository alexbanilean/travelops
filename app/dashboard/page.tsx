"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Users, Calendar, ArrowRight, Plane } from "lucide-react";
import { format } from "date-fns";

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

  useEffect(() => {
    fetch("/api/events")
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage your corporate trips and events</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" />
            New event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first corporate event and let AI handle the planning.</p>
          <Link href="/dashboard/events/new">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
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
              <Card key={event.id} className="border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    {budgetStatus && (
                      <Badge variant={budgetStatus.variant} className="text-xs">
                        {budgetStatus.label}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                    {event.name}
                  </h3>
                  <p className="text-blue-600 font-medium text-sm mb-4">
                    {event.destination}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(event.startDate), "MMM d")} –{" "}
                      {format(new Date(event.endDate), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {event.participants} participants
                    </div>
                  </div>
                  {event.budget && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Budget usage</span>
                        <span>€{totalEstimated.toLocaleString()} / €{event.budget.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            totalEstimated > event.budget
                              ? "bg-red-500"
                              : totalEstimated / event.budget > 0.9
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (totalEstimated / event.budget) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <Link href={`/dashboard/events/${event.id}`}>
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-blue-50 gap-2">
                      Open event
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
