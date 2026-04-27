"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { splitAgentStreamPayload } from "@/lib/agent-stream-protocol";
import {
  ArrowLeft,
  Receipt,
  Upload,
  Sparkles,
  CheckCircle,
  Clock,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { actorHeaders } from "@/lib/browser-actor";

interface Invoice {
  id: string;
  filename: string;
  vendor: string | null;
  amount: number | null;
  category: string | null;
  date: string | null;
  rawData: string | null;
}

interface Event {
  id: string;
  name: string;
  destination: string;
  invoices: Invoice[];
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "bg-purple-100 text-purple-700",
  transport: "bg-primary/15 text-primary",
  food: "bg-orange-100 text-orange-700",
  activities: "bg-green-100 text-green-700",
  other: "bg-muted text-foreground",
};

export default function InvoicesPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [financeAgentError, setFinanceAgentError] = useState("");

  const fetchEvent = useCallback(() => {
    fetch(`/api/events/${id}`, { headers: { ...actorHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", id);

      try {
        const res = await fetch("/api/invoices/upload", {
          method: "POST",
          headers: { ...actorHeaders() },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          setUploadError(err.error || "Upload failed");
        }
      } catch {
        setUploadError("Upload failed. Please try again.");
      }
    }

    setUploading(false);
    fetchEvent();
  };

  const processInvoice = async (invoiceId: string) => {
    setProcessingIds((prev) => new Set(prev).add(invoiceId));
    setFinanceAgentError("");

    try {
      const res = await fetch("/api/agents/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...actorHeaders() },
        body: JSON.stringify({
          eventId: id,
          action: "processInvoice",
          invoiceId,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setFinanceAgentError(
          typeof errBody?.error === "string"
            ? errBody.error
            : "Could not start invoice processing."
        );
        return;
      }

      if (!res.body) {
        setFinanceAgentError("No response from server.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const { streamError: finalErr } = splitAgentStreamPayload(fullText);
      if (finalErr) {
        setFinanceAgentError(finalErr);
        return;
      }

      fetchEvent();
    } catch (err) {
      console.error(err);
      setFinanceAgentError(
        err instanceof Error ? err.message : "Invoice processing failed."
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(invoiceId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!event) return null;

  const processedCount = event.invoices.filter((inv) => inv.vendor).length;

  return (
    <div>
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            {event.name} · {event.invoices.length} invoice
            {event.invoices.length !== 1 ? "s" : ""} · {processedCount} processed
          </p>
        </div>
      </div>

      {financeAgentError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{financeAgentError}</AlertDescription>
        </Alert>
      )}

      {/* Upload zone */}
      <Card
        className={`border-2 border-dashed mb-8 transition-colors ${
          dragOver
            ? "border-purple-400 bg-purple-50"
            : "border-border hover:border-muted-foreground/30"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="p-10 text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${
              dragOver ? "bg-purple-100" : "bg-muted"
            }`}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
            ) : (
              <Upload
                className={`w-7 h-7 ${dragOver ? "text-purple-600" : "text-muted-foreground"}`}
              />
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {uploading ? "Uploading..." : "Drop invoices here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            JPEG, PNG, WebP or PDF · The Finance Agent will extract data automatically
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              className="pointer-events-none"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose files
            </Button>
          </label>
          {uploadError && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg border border-red-200 max-w-sm mx-auto">
              <X className="w-4 h-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice info box */}
      <div className="mb-6 bg-primary/10 border border-primary/25 rounded-xl p-4 flex gap-3">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">Finance Agent — Invoice OCR</p>
          <p className="text-sm text-primary mt-0.5">
            Upload an invoice (PDF or image) and click "Process" — the Finance Agent uses Gemini Vision to extract vendor name, amount, expense category and date automatically.
          </p>
        </div>
      </div>

      {/* Invoice list */}
      {event.invoices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No invoices yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Upload invoices above and the Finance Agent will extract all the data using AI.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {event.invoices.map((invoice) => {
            const isProcessed = !!invoice.vendor;
            const isProcessing = processingIds.has(invoice.id);

            return (
              <Card key={invoice.id} className="border border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isProcessed ? "bg-green-50" : "bg-muted/50"
                      }`}
                    >
                      {isProcessed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm truncate">
                          {invoice.vendor || invoice.filename}
                        </span>
                        {isProcessed ? (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs flex-shrink-0">
                            Processed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs flex-shrink-0 text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>

                      {isProcessed ? (
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {invoice.amount && (
                            <span className="font-semibold text-foreground">
                              €{invoice.amount.toLocaleString()}
                            </span>
                          )}
                          {invoice.category && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                CATEGORY_COLORS[invoice.category] || CATEGORY_COLORS.other
                              }`}
                            >
                              {invoice.category}
                            </span>
                          )}
                          {invoice.date && (
                            <span className="text-muted-foreground text-xs">{invoice.date}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {invoice.filename} · Ready to process
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {invoice.filename && (
                        <a
                          href={`/uploads/${invoice.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </a>
                      )}
                      {!isProcessed && (
                        <Button
                          size="sm"
                          onClick={() => processInvoice(invoice.id)}
                          disabled={isProcessing}
                          className="bg-purple-600 hover:bg-purple-700 gap-1.5 text-xs h-8"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Process
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {event.invoices.length > 0 && (
        <Card className="border border-border mt-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {processedCount} of {event.invoices.length} invoices processed
              </span>
              {processedCount > 0 && (
                <span className="font-semibold text-foreground">
                  Total: €
                  {event.invoices
                    .filter((inv) => inv.amount)
                    .reduce((s, inv) => s + (inv.amount || 0), 0)
                    .toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
