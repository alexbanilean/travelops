import { NextRequest } from "next/server";
import { createFinanceAgentStream } from "@/lib/agents/finance-agent";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const stream = createFinanceAgentStream({
    eventId: body.eventId,
    action: body.action || "estimate",
    invoiceId: body.invoiceId,
  });

  return stream.toTextStreamResponse();
}
