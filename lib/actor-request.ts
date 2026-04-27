import type { NextRequest } from "next/server";

const MAX_LEN = 120;

export function getActorFromRequest(req: NextRequest): string {
  const raw = req.headers.get("x-travelops-actor")?.trim();
  if (!raw) return "Guest";
  return raw.slice(0, MAX_LEN);
}
