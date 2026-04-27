import { google } from "@ai-sdk/google";
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

export async function extractInvoiceData(
  filePath: string
): Promise<ExtractedInvoice | null> {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const base64 = fileBuffer.toString("base64");
    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "image/jpeg";

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
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

    return object;
  } catch (error) {
    console.error("Invoice extraction error:", error);
    return null;
  }
}
