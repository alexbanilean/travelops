import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const eventId = formData.get("eventId") as string;

  if (!file || !eventId) {
    return NextResponse.json(
      { error: "File and eventId are required" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP and PDF files are supported" },
      { status: 400 }
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const ext = file.name.split(".").pop();
  const filename = `${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(uploadsDir, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const invoice = await prisma.invoice.create({
    data: {
      eventId,
      filename,
    },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { budgetReviewStale: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
