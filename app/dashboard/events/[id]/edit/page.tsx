"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";
import { actorHeaders } from "@/lib/browser-actor";

function toInputDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    participants: "",
    budget: "",
    preferences: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${id}`, { headers: { ...actorHeaders() } })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((ev) => {
        if (cancelled) return;
        setForm({
          name: ev.name ?? "",
          destination: ev.destination ?? "",
          startDate: toInputDate(ev.startDate),
          endDate: toInputDate(ev.endDate),
          participants: String(ev.participants ?? ""),
          budget: ev.budget != null ? String(ev.budget) : "",
          preferences: ev.preferences ?? "",
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Event could not be loaded.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...actorHeaders() },
        body: JSON.stringify({
          name: form.name,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          participants: parseInt(form.participants, 10),
          budget: form.budget ? parseFloat(form.budget) : null,
          preferences: form.preferences.trim() ? form.preferences : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(
          typeof err?.error === "string"
            ? err.error
            : JSON.stringify(err?.error ?? "Update failed")
        );
        return;
      }

      router.push(`/dashboard/events/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit event</h1>
        <p className="text-muted-foreground mt-1">
          Update trip details. Itinerary and expenses stay attached unless you regenerate them.
        </p>
      </div>

      <Card className="border border-border">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Event name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="destination" className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                Destination
              </Label>
              <Input
                id="destination"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Start date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  End date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="participants" className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  Participants
                </Label>
                <Input
                  id="participants"
                  type="number"
                  min={1}
                  max={2000}
                  value={form.participants}
                  onChange={(e) => setForm({ ...form, participants: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="budget" className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Budget (€) <span className="text-muted-foreground font-normal">optional</span>
                </Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferences">Preferences (optional)</Label>
              <Textarea
                id="preferences"
                className="mt-2"
                rows={3}
                value={form.preferences}
                onChange={(e) => setForm({ ...form, preferences: e.target.value })}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
