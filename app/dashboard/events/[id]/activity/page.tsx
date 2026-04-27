"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, Shield } from "lucide-react";
import { format } from "date-fns";
import { actorHeaders } from "@/lib/browser-actor";

interface VersionRow {
  id: string;
  versionNumber: number;
  totalEstimated: number;
  summaryLine: string;
  createdAt: string;
}

interface AuditRow {
  id: string;
  actorName: string;
  action: string;
  payload: string | null;
  createdAt: string;
}

export default function EventActivityPage() {
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    Promise.all([
      fetch(`/api/events/${id}/versions`).then((r) => r.json()),
      fetch(`/api/events/${id}/audit`).then((r) => r.json()),
    ])
      .then(([v, a]) => {
        setVersions(Array.isArray(v) ? v : []);
        setAudit(Array.isArray(a) ? a : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const restore = async (versionId: string) => {
    setRestoring(versionId);
    setMsg("");
    try {
      const res = await fetch(`/api/events/${id}/versions/${versionId}/restore`, {
        method: "POST",
        headers: { ...actorHeaders() },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(typeof j?.error === "string" ? j.error : "Restore failed");
        return;
      }
      setMsg("Restored. Expenses were re-synced from that version.");
      load();
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/dashboard/events/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to event
      </Link>
      <h1 className="text-3xl font-bold text-foreground">Activity & versions</h1>
      <p className="mt-1 text-muted-foreground">
        Audit trail and itinerary history. Restoring a version updates live itinerary and category
        expenses.
      </p>

      {msg && (
        <p className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-foreground">
          {msg}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card className="border border-border">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <History className="size-4 text-primary" />
              Itinerary versions
            </h2>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved versions yet.</p>
            ) : (
              <ul className="space-y-3">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-foreground">v{v.versionNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(v.createdAt), "MMM d, yyyy HH:mm")} · €
                        {v.totalEstimated.toLocaleString()}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {v.summaryLine}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!restoring}
                      onClick={() => restore(v.id)}
                    >
                      {restoring === v.id ? "Restoring…" : "Restore"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Shield className="size-4 text-emerald-600" />
              Audit log
            </h2>
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            ) : (
              <ul className="max-h-[480px] space-y-2 overflow-y-auto text-sm">
                {audit.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-md border border-border/80 bg-muted/20 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {row.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(row.createdAt), "MMM d HH:mm:ss")}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-foreground">{row.actorName}</div>
                    {row.payload && (
                      <pre className="mt-1 max-h-24 overflow-auto text-[10px] text-muted-foreground">
                        {row.payload}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
