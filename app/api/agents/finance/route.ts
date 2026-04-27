import { NextRequest, NextResponse } from "next/server";
import { createFinanceAgentStream } from "@/lib/agents/finance-agent";
import { createAgentLogger } from "@/lib/agent-server-log";
import { formatLlmError } from "@/lib/format-llm-error";
import { toAgentPlainTextStreamResponse } from "@/lib/to-agent-plain-text-stream-response";

export async function POST(req: NextRequest) {
  const routeLog = createAgentLogger("finance-api");
  try {
    const body = await req.json();

    if (!body?.eventId || typeof body.eventId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid eventId." },
        { status: 400 }
      );
    }

    routeLog.info("POST /api/agents/finance accepted", {
      eventId: body.eventId,
      action: body.action || "estimate",
      invoiceId: body.invoiceId,
    });

    const stream = createFinanceAgentStream({
      eventId: body.eventId,
      action: body.action || "estimate",
      invoiceId: body.invoiceId,
    });

    return toAgentPlainTextStreamResponse(stream, "finance-stream");
  } catch (error) {
    routeLog.warn("POST /api/agents/finance failed before stream", {
      message: formatLlmError(error),
    });
    return NextResponse.json(
      { error: formatLlmError(error) },
      { status: 500 }
    );
  }
}
