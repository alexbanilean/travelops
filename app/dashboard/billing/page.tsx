"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";

interface BillingPayload {
  organizationId: string;
  organizationName: string;
  planTier: string;
  status: string;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  message: string;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingPayload | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((j) => {
        if (j?.error) setErr(String(j.error));
        else setData(j);
      })
      .catch(() => setErr("Could not load billing."));
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-2">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Events
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & plan</h1>
      <p className="mt-1 text-muted-foreground">
        Subscription-ready snapshot for your workspace (demo: no charges).
      </p>

      {err && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {err}
        </p>
      )}

      {data && (
        <Card className="mt-8 border border-border">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="size-5 text-primary" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{data.organizationName}</div>
                  <div className="truncate text-xs text-muted-foreground">{data.organizationId}</div>
                </div>
              </div>
              <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Demo
              </span>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium text-foreground">{data.planTier}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-foreground">{data.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Stripe customer</dt>
                <dd className="font-mono text-xs text-muted-foreground">
                  {data.stripeCustomerId ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Current period end</dt>
                <dd className="text-muted-foreground">
                  {data.currentPeriodEnd
                    ? new Date(data.currentPeriodEnd).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
            <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              {data.message}
            </p>
            <Button variant="outline" className="w-full" disabled>
              Upgrade (Stripe in production)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
