import { format } from "date-fns";

export type ExportItinerary = {
  days: Array<{
    day: number;
    date: string;
    title: string;
    items: Array<{
      id?: string;
      time: string;
      type: string;
      name: string;
      description?: string;
      estimatedCost: number;
    }>;
  }>;
  totalEstimatedCost: number;
  summary?: string;
};

function escapeCsvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function itineraryToCsv(
  itinerary: ExportItinerary,
  meta: { eventName: string; destination: string }
): string {
  const lines: string[] = [
    ["event", escapeCsvCell(meta.eventName)].join(","),
    ["destination", escapeCsvCell(meta.destination)].join(","),
    "",
    "day,date,title,line_id,time,type,name,estimated_eur",
  ];
  for (const day of itinerary.days) {
    for (const item of day.items) {
      lines.push(
        [
          day.day,
          escapeCsvCell(day.date),
          escapeCsvCell(day.title),
          escapeCsvCell(item.id || ""),
          escapeCsvCell(item.time),
          escapeCsvCell(item.type),
          escapeCsvCell(item.name),
          String(item.estimatedCost),
        ].join(",")
      );
    }
  }
  lines.push("", "total_estimated_eur", String(itinerary.totalEstimatedCost));
  return lines.join("\n");
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatIcsDate(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Rough all-day blocks per trip day (no precise times in source data). */
export function itineraryToIcs(
  itinerary: ExportItinerary,
  meta: { eventName: string; destination: string; startDateIso: string }
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TravelOps//Itinerary//EN",
    "CALSCALE:GREGORIAN",
  ];
  const base = new Date(meta.startDateIso);
  if (!Number.isFinite(base.getTime())) {
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  for (const day of itinerary.days) {
    const dayStart = new Date(base);
    dayStart.setUTCDate(base.getUTCDate() + (day.day - 1));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const uid = `travelops-${meta.eventName}-${day.day}-${day.date}@travelops.local`
      .replace(/\s+/g, "-")
      .slice(0, 200);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART;VALUE=DATE:${format(dayStart, "yyyyMMdd")}`,
      `DTEND;VALUE=DATE:${format(dayEnd, "yyyyMMdd")}`,
      `SUMMARY:${foldIcs(meta.eventName + " — " + day.title)}`,
      `DESCRIPTION:${foldIcs(`${meta.destination}. ${day.items.map((i) => i.time + " " + i.name).join("; ")}`)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function foldIcs(s: string): string {
  const esc = s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
  return esc.replace(/\r?\n/g, "\\n").slice(0, 2000);
}

export function itineraryToPrintableHtml(
  itinerary: ExportItinerary,
  meta: { eventName: string; destination: string }
): string {
  const rows: string[] = [];
  for (const day of itinerary.days) {
    rows.push(
      `<tr><th colspan="5" style="background:#f4f4f5;padding:8px;text-align:left">Day ${day.day} — ${escapeHtml(day.date)} — ${escapeHtml(day.title)}</th></tr>`
    );
    for (const item of day.items) {
      rows.push(
        `<tr><td>${escapeHtml(item.id || "—")}</td><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.name)}</td><td style="text-align:right">€${item.estimatedCost.toLocaleString()}</td></tr>`
      );
    }
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(meta.eventName)}</title>
  <style>body{font-family:system-ui,sans-serif;max-width:900px;margin:24px} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ddd;padding:6px;font-size:14px}</style></head><body>
  <h1>${escapeHtml(meta.eventName)}</h1><p>${escapeHtml(meta.destination)}</p>
  ${itinerary.summary ? `<p>${escapeHtml(itinerary.summary)}</p>` : ""}
  <table><thead><tr><th>Line</th><th>Time</th><th>Type</th><th>Name</th><th>€</th></tr></thead><tbody>${rows.join("")}</tbody></table>
  <p><strong>Total estimated:</strong> €${itinerary.totalEstimatedCost.toLocaleString()}</p>
  <p class="muted" style="color:#666;font-size:12px">Print this page to PDF from your browser (File → Print → Save as PDF).</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
