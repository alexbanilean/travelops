# TravelOps

> **"The command center for corporate travel — combining planning, booking, and expense tracking into one streamlined system."**

TravelOps is an AI-powered corporate itinerary planner and expense tracker built with **Next.js 15**, **Google Gemini 2.0 Flash**, and **two coordinated AI agents**.

## Live Demo

Landing page: `http://localhost:3000`  
Dashboard: `http://localhost:3000/dashboard`

## The Two AI Agents

| Agent | Role | Tools |
|-------|------|-------|
| **Planning Agent** | Corporate travel concierge — builds complete day-by-day itineraries | `searchFlights`, `searchHotels`, `searchActivities`, `searchRestaurants`, `saveItinerary` |
| **Finance Agent** | Finance controller — tracks budgets, OCRs invoices, flags overruns | `getBudgetSummary`, `calculateBudgetBreakdown`, `compareWithBudget`, `processInvoice`, `recordExpense` |

Both agents use **multi-step tool calling** via the Vercel AI SDK (`maxSteps: 8`) — you can watch them call tools live in the streaming UI.

## Cost

**$0.** Powered by [Google Gemini 2.0 Flash](https://aistudio.google.com) free tier:
- 15 requests/minute
- 1 million tokens/minute  
- No credit card required

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
# Edit .env.local and add your GOOGLE_GENERATIVE_AI_API_KEY

# Run database migration
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Landing page** — marketing page with CTA, features, how-it-works, testimonials
- **Events dashboard** — create and manage corporate events
- **AI itinerary generator** — Planning Agent builds day-by-day schedules with tool calls visible in real time
- **Vendor discovery** — hotels, flights, activities, restaurants across major European cities
- **Budget dashboard** — pie chart, estimated vs confirmed bar chart, real-time alerts
- **Invoice processing** — drag-and-drop upload, Finance Agent OCR via Gemini Vision
- **Real-time streaming** — watch agents think and call tools as they work

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Vercel AI SDK** (`ai`, `@ai-sdk/google`)
- **Google Gemini 2.0 Flash** (Planning + Finance agents)
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
        page.tsx              ← Event overview
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
```
