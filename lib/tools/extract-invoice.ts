import { google } from "@ai-sdk/google";
import { GEMINI_MODEL } from "@/lib/ai-model";
import { formatLlmError } from "@/lib/format-llm-error";
import { getGeminiMaxRetries } from "@/lib/gemini-rate-limit";
import { generateObject } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";

const InvoiceSchema = z.object({
  vendor: z.string().describe("Vendor or supplier name"),
  amount: z.number().describe("Total invoice amount in EUR"),
  category: z
    .enum(["accommodation", "transport", "food", "activities", "other"])
    .describe("Expense category"),
  date: z.string().describe("Invoice date in YYYY-MM-DD format"),
  currency: z.string().default("EUR"),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
});

export type ExtractedInvoice = z.infer<typeof InvoiceSchema>;

export type ExtractInvoiceResult =
  | { ok: true; data: ExtractedInvoice }
  | { ok: false; error: string };

export async function extractInvoiceData(
  filePath: string
): Promise<ExtractInvoiceResult> {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      return { ok: false, error: "Invoice file not found on the server." };
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const base64 = fileBuffer.toString("base64");
    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "image/jpeg";

    const { object } = await generateObject({
      model: google(GEMINI_MODEL),
      maxRetries: getGeminiMaxRetries(),
      schema: InvoiceSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an invoice processing assistant for a corporate travel management system. 
Extract the following information from this invoice document:
- Vendor/supplier name
- Total amount (convert to EUR if needed, use approximate conversion)
- Expense category (accommodation, transport, food, activities, or other)
- Invoice date (YYYY-MM-DD format)
- Line items if visible

Be precise and extract exactly what is shown. If a field is not clearly visible, make a reasonable inference based on the document type.`,
            },
            {
              type: "image",
              image: base64,
              mediaType: mimeType as "image/jpeg" | "application/pdf",
            },
          ],
        },
      ],
    });

    return { ok: true, data: object };
  } catch (error) {
    console.error("Invoice extraction error:", error);
    return { ok: false, error: formatLlmError(error) };
  }
}
