"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { format } from "date-fns";

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
  expenses: { id: string; category: string; estimated: number; confirmed: number | null }[];
  invoices: { id: string; vendor: string | null; amount: number | null }[];
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!event || "error" in (event as object)) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Event not found</p>
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
  const nights = Math.round(
    (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        All events
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-blue-600 font-medium">
              <MapPin className="w-4 h-4" />
              {event.destination}
            </div>
          </div>
          {hasItinerary ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Itinerary ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              Pending planning
            </Badge>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
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
            <Card key={label} className="border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <div className="font-bold text-gray-900 text-lg">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href={`/dashboard/events/${id}/itinerary`} className="group">
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Itinerary</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                {hasItinerary
                  ? "View and manage the AI-generated day-by-day itinerary."
                  : "Generate a complete day-by-day itinerary with the Planning Agent."}
              </p>
              <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                {hasItinerary ? "View itinerary" : "Generate itinerary"}
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/events/${id}/budget`} className="group">
          <Card className="border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
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
          <Card className="border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Invoices</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
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

      {event.preferences && (
        <Card className="border border-gray-100 mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Event preferences</h3>
            <p className="text-gray-600 text-sm">{event.preferences}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
