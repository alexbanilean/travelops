# TravelOps

> **"The command center for corporate travel — combining planning, booking, and expense tracking into one streamlined system."**

TravelOps is an AI-powered corporate itinerary planner and expense tracker built with **Next.js**, **Google Gemini** (model configurable), and **two coordinated AI agents**.

## Live Demo

Landing page: `http://localhost:3000`  
Dashboard: `http://localhost:3000/dashboard`

## The Two AI Agents

| Agent | Role | Tools |
|-------|------|-------|
| **Planning Agent** | Corporate travel concierge — builds complete day-by-day itineraries | `searchFlights`, `searchHotels`, `searchActivities`, `searchRestaurants`, `saveItinerary` |
| **Finance Agent** | Finance controller — tracks budgets, OCRs invoices, flags overruns | `getBudgetSummary`, `calculateBudgetBreakdown`, `compareWithBudget`, `processInvoice`, `recordExpense` |

Both agents use **multi-step tool calling** via the Vercel AI SDK (`stopWhen: stepCountIs(...)`) — you can watch them call tools live in the streaming UI.

## Cost

**$0** when your Google AI Studio free tier allows the chosen model. Default model is **`gemini-2.5-flash`** (override with `GOOGLE_GENERATIVE_AI_MODEL` in `.env.local`).

### If you get HTTP 429 (`RESOURCE_EXHAUSTED`, `limit: 0`)

That response means **no free-tier quota is allocated for that model** on your API key or project (common with `gemini-2.0-flash` for some new keys). It is not a bug in TravelOps.

1. Set **`GOOGLE_GENERATIVE_AI_MODEL`** to another model your quota supports, for example `gemini-1.5-flash` or `gemini-2.5-flash`, then restart `npm run dev`.
2. In [Google AI Studio](https://aistudio.google.com) or Google Cloud Console, ensure the **Generative Language API** is enabled for the project tied to the key.
3. Wait for the retry window or try a different Google account / project if the daily cap was hit.

### Free tier RPM (`limit: 5` per minute per model)

Google’s free tier often caps **`GenerateRequestsPerMinutePerProjectPerModel`** at **5** for models like `gemini-2.5-flash`. TravelOps agents use **multi-step tool calling**: each model turn after tools is typically **another** `generateContent` call, so **one** “Generate itinerary” action can issue **6+** calls in a few seconds and trigger **429** even when daily token limits are fine.

**What we do by default**

- **`GOOGLE_GENERATIVE_AI_STEP_DELAY_MS`** — waits **~13 seconds** between agent steps (after the first) so sustained runs stay under ~5 RPM. Set to **`0`** to disable (faster, but easier to 429).
- **`GOOGLE_GENERATIVE_AI_MAX_RETRIES`** — **`0`** by default. The AI SDK otherwise retries **429**s (e.g. 3 total attempts), which **triples** quota usage on failure and makes AI Studio look worse than it should.

**Why AI Studio can show “success” while the app looked empty (fixed in app UX)**

- The planning/finance routes return **HTTP 200** with a **plain-text stream** so the browser can read chunks as they arrive. Google’s **429** often arrives **after** streaming started; the UI now appends a marked error block and shows a **red alert** instead of silently stopping.
- AI Studio metrics aggregate **every** `generateContent` call (each agent step is often its own call). A **daily** cap such as **`GenerateRequestsPerDayPerProjectPerModel`** (e.g. **20/day** for `gemini-2.5-flash`) can be hit even from **earlier** tests the same day — so “I only clicked once” can still fail if the quota was already exhausted.
- **Another model = another quota bucket** on free tier. If `gemini-2.5-flash` hits **daily** limits, try **`gemini-2.0-flash`** or **`gemini-1.5-flash`** in `GOOGLE_GENERATIVE_AI_MODEL` (same tool-calling stack; verify your key has quota for that id in AI Studio).

### Server logs while agents run

Long runs print **timestamped** lines with prefixes such as `[travelops:planning-api]`, `[travelops:planning]`, `[travelops:planning-stream]`, `[travelops:gemini-rate-limit]`, and the `finance` equivalents. Grep your dev terminal for `travelops:` to follow LLM steps, tool execution, inter-step throttle sleeps, and HTTP stream lifecycle.

## Quick Start

### 1. Get a free Google AI API key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **"Get API Key"**
3. Create a new key (free, no credit card)

### 2. Set up the project

```bash
# Use Node.js 22+
nvm use 22

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.local.example .env.local
# Edit .env.local: GOOGLE_GENERATIVE_AI_API_KEY (required)
# Optional: GOOGLE_GENERATIVE_AI_MODEL, GOOGLE_GENERATIVE_AI_STEP_DELAY_MS,
# GOOGLE_GENERATIVE_AI_MAX_RETRIES (see README “Free tier RPM”)

# Run database migration
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Landing page** — marketing page with CTA, features, how-it-works, testimonials
- **Events dashboard** — create, **edit**, **delete**, and open corporate events
- **AI itinerary generator** — Planning Agent builds day-by-day schedules with tool calls visible in real time; vendor rows can include **grounding links** (Flights / Hotels / Maps) from search tool metadata; saved JSON includes **quote time**, **stale-after hints**, **data provenance**, and optional **flight tracking** links (discovery / FR24-style URLs — not a live PNR)
- **Vendor discovery** — hotels, flights, activities, restaurants across major European cities
- **Budget dashboard** — pie chart, estimated vs confirmed bar chart, real-time alerts
- **Invoice processing** — drag-and-drop upload, Finance Agent OCR via Gemini Vision
- **Real-time streaming** — watch agents think and call tools as they work

## Trust, pricing, and “real” data

This repo ships a **demo catalog** plus deep links (Google Flights/Hotels/Maps, FlightRadar24-style tracking URLs) so users can **verify** options themselves. **Bookable NDC/GDS fares**, hotel CRS rates, and **PNR-level** flight tracking are **not** something open data alone solves: production trust needs supplier APIs (e.g. Duffel, Amadeus, Sabre), signed offers where available, and explicit provenance on every line item. The UI surfaces saved `pricingTrustNote`, quote timestamps, per-item expiry hints, and sources accordingly.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`)
- **Google Gemini** via `@ai-sdk/google` (default `gemini-2.5-flash`; override with env)
- **Prisma + SQLite** (zero-infrastructure database)
- **shadcn/ui + Tailwind CSS**
- **Recharts** (budget visualizations)

## Project Structure

```
app/
  page.tsx                    ← Landing page
  dashboard/
    page.tsx                  ← Events list
    events/
      new/page.tsx            ← Create event form
      [id]/
        page.tsx              ← Event overview (edit / delete)
        edit/page.tsx         ← Edit event form
        itinerary/page.tsx    ← Planning Agent + itinerary
        budget/page.tsx       ← Finance dashboard
        invoices/page.tsx     ← Invoice upload & OCR
  api/
    events/                   ← Event CRUD
    agents/planning/          ← Planning Agent endpoint
    agents/finance/           ← Finance Agent endpoint
    invoices/upload/          ← File upload endpoint
lib/
  agents/
    planning-agent.ts         ← Planning Agent definition
    finance-agent.ts          ← Finance Agent definition
  tools/
    search-hotels.ts
    search-flights.ts
    search-activities.ts
    search-restaurants.ts
    extract-invoice.ts        ← Gemini Vision OCR
  db.ts                       ← Prisma client
  gemini-rate-limit.ts        ← Free-tier step delay + maxRetries helpers
  agent-server-log.ts         ← Timestamped console logging for agents / routes
  agent-stream-log-hooks.ts   ← streamText lifecycle hooks (steps, tools, finish)
  travel-source-urls.ts       ← Discovery URLs attached to mock search results
```
