"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Users, Calendar, DollarSign, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          participants: parseInt(form.participants),
          budget: form.budget ? parseFloat(form.budget) : undefined,
          preferences: form.preferences || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(JSON.stringify(err.error));
        return;
      }

      const event = await res.json();
      router.push(`/dashboard/events/${event.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create new event</h1>
        <p className="text-gray-500 mt-1">
          Fill in the details and our AI agents will take it from there.
        </p>
      </div>

      <Card className="border border-gray-100">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Event name
              </Label>
              <Input
                id="name"
                placeholder="Q2 Team Building Retreat"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="destination" className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Destination
              </Label>
              <Input
                id="destination"
                placeholder="Barcelona, Spain"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Try: Barcelona, Prague, Amsterdam, or any European city
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
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
                  <Calendar className="w-4 h-4 text-blue-500" />
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
                  <Users className="w-4 h-4 text-blue-500" />
                  Participants
                </Label>
                <Input
                  id="participants"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="20"
                  value={form.participants}
                  onChange={(e) => setForm({ ...form, participants: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="budget" className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  Budget (€) <span className="text-gray-400 font-normal">optional</span>
                </Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferences" className="flex items-center gap-2 mb-2">
                Preferences <span className="text-gray-400 font-normal">optional</span>
              </Label>
              <Textarea
                id="preferences"
                placeholder="Outdoor activities, team building focus, vegetarian-friendly restaurants, 4-star hotels minimum..."
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating event...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create event & start planning
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
