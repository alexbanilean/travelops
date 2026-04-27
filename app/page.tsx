import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LandingHeaderActions } from "@/components/landing-header-actions";
import {
  MapPin,
  Brain,
  Receipt,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Plane,
  Hotel,
  Utensils,
  Activity,
  Star,
  Zap,
  Shield,
  Clock,
  Search,
  Building2,
  Compass,
  UtensilsCrossed,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav — floating glass (ui-ux-pro-max) */}
      <div className="sticky top-0 z-50 pt-3 sm:pt-4">
        <header className="glass-header container-app rounded-2xl border">
          <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
            <Link
              href="/"
              className="flex cursor-pointer items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Plane className="size-4" aria-hidden />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                TravelOps
              </span>
            </Link>
            <nav
              className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
              aria-label="Page sections"
            >
              <a
                href="#features"
                className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              >
                Pricing
              </a>
            </nav>
            <LandingHeaderActions />
          </div>
        </header>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/12 via-background to-accent/20 pb-28 pt-16 sm:pt-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="container-app relative text-center">
          <Badge className="mb-6 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
            <Zap className="mr-1 size-3" aria-hidden />
            Powered by AI Agents
          </Badge>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-7xl">
            Corporate travel,{" "}
            <span className="bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
              reimagined
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
            TravelOps is the command center for corporate travel — combining AI-powered planning, booking, and expense tracking into one streamlined system. Reduce planning time from days to minutes.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard/events/new" className="cursor-pointer">
              <Button
                size="lg"
                className="h-14 cursor-pointer gap-2 bg-primary px-8 text-lg text-primary-foreground shadow-md transition-colors duration-200 hover:bg-primary/90"
              >
                Start planning for free
                <ArrowRight className="size-5" aria-hidden />
              </Button>
            </Link>
            <Link href="/dashboard" className="cursor-pointer">
              <Button size="lg" variant="outline" className="h-14 cursor-pointer px-8 text-lg transition-colors duration-200">
                View demo
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required · Free during beta
          </p>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8">
            {[
              { value: "85%", label: "Less planning time" },
              { value: "€1.4T", label: "Global corp. travel market" },
              { value: "2", label: "AI Agents working for you" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-primary">{value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="border-y border-border bg-muted/50 py-12">
        <div className="container-app">
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Trusted by HR teams at Fortune 1000 companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-45">
            {["Accenture", "Deloitte", "McKinsey", "PwC", "KPMG", "EY"].map(
              (name) => (
                <span
                  key={name}
                  className="text-xl font-bold tracking-tight text-muted-foreground"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-background py-24">
        <div className="container-app">
          <div className="mb-16 text-center">
            <Badge className="mb-4 border border-primary/25 bg-accent text-accent-foreground hover:bg-accent/90">
              Two AI Agents
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Intelligence built into every step
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Two specialized AI agents work in concert to handle planning logistics and financial tracking — automatically.
            </p>
          </div>

          <div className="mb-16 grid gap-8 md:grid-cols-2">
            {/* Planning Agent */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/8 to-card shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-8">
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Brain className="size-6" aria-hidden />
                </div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  Agent 1
                </div>
                <h3 className="mb-3 text-2xl font-bold text-foreground">
                  Planning Agent
                </h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Your AI travel concierge. Give it a destination, dates, headcount and budget — it searches flights, hotels, activities and restaurants, then builds a complete day-by-day itinerary.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Plane, text: "Flights" },
                    { icon: Hotel, text: "Hotels" },
                    { icon: Activity, text: "Activities" },
                    { icon: Utensils, text: "Restaurants" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/15">
                        <Icon className="size-3 text-primary" aria-hidden />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Finance Agent */}
            <Card className="border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-card shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-emerald-400/30">
              <CardContent className="p-8">
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md dark:bg-emerald-500">
                  <Receipt className="size-6" aria-hidden />
                </div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Agent 2
                </div>
                <h3 className="mb-3 text-2xl font-bold text-foreground">
                  Finance Agent
                </h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  Your AI finance controller. It tracks budgets in real time, processes uploaded invoices via OCR, flags overspending risks, and keeps every euro accounted for.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: BarChart3, text: "Budget tracking" },
                    { icon: Receipt, text: "Invoice OCR" },
                    { icon: Shield, text: "Overspend alerts" },
                    { icon: CheckCircle, text: "Policy compliance" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-emerald-500/15">
                        <Icon className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Minutes, not days",
                description:
                  "Generate a full 3-day corporate retreat itinerary with vendor options in under 2 minutes.",
                color: "text-primary",
                bg: "bg-primary/12",
              },
              {
                icon: BarChart3,
                title: "Real-time dashboard",
                description:
                  "Live budget visualization with pie charts and spending timelines. Know your position at a glance.",
                color: "text-chart-4",
                bg: "bg-chart-4/12",
              },
              {
                icon: Shield,
                title: "Policy compliance",
                description:
                  "Automatic flagging when spending approaches or exceeds approved budgets — before it's a problem.",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/12",
              },
            ].map(({ icon: Icon, title, description, color, bg }) => (
              <Card key={title} className="border-border transition-shadow duration-200 hover:shadow-md">
                <CardContent className="p-6">
                  <div className={`mb-4 flex size-10 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`size-5 ${color}`} aria-hidden />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/50 py-24">
        <div className="container-app">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              From idea to itinerary in 3 steps
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              TravelOps makes corporate event planning effortless for HR teams of any size.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="absolute left-1/3 right-1/3 top-12 hidden h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 md:block" />

            {[
              {
                step: "1",
                title: "Create your event",
                description:
                  "Enter destination, dates, headcount and budget. That's it — TravelOps handles everything else.",
                icon: MapPin,
                color: "bg-blue-600",
              },
              {
                step: "2",
                title: "Let the AI agents work",
                description:
                  "The Planning Agent builds your itinerary. The Finance Agent estimates costs and monitors the budget.",
                icon: Brain,
                color: "bg-indigo-600",
              },
              {
                step: "3",
                title: "Track, confirm, complete",
                description:
                  "Upload invoices, confirm vendors, track spending in real time. Close the event with full financial clarity.",
                icon: CheckCircle,
                color: "bg-emerald-600",
              },
            ].map(({ step, title, description, icon: Icon, color }) => (
              <div key={step} className="text-center relative">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -translate-y-2 right-6 top-0 flex size-6 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-bold text-muted-foreground md:left-1/2 md:right-auto md:-translate-x-1/2">
                  {step}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{title}</h3>
                <p className="leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="bg-background py-24">
        <div className="container-app max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              See it in action
            </h2>
            <p className="text-muted-foreground">
              A real example: 20 people, 2 days in Prague, €8,000 budget
            </p>
          </div>
          <Card className="overflow-hidden border-2 border-border shadow-lg">
            <div className="flex items-center gap-2 bg-foreground px-4 py-3">
              <div className="size-3 shrink-0 rounded-full bg-red-500" aria-hidden />
              <div className="size-3 shrink-0 rounded-full bg-amber-400" aria-hidden />
              <div className="size-3 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="ml-3 font-mono text-xs text-background/70">
                TravelOps — Planning Agent
              </span>
            </div>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <span className="text-xs font-medium text-foreground">HR</span>
                  </div>
                  <div className="max-w-md rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <p className="text-sm text-foreground">
                      Plan a 2-day team building in Prague for 20 people with €8,000.
                    </p>
                  </div>
                </div>
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-lg space-y-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      {[
                        { Icon: Search, label: "Searching flights…" },
                        { Icon: Building2, label: "Finding hotels…" },
                        { Icon: Compass, label: "Searching activities…" },
                        { Icon: UtensilsCrossed, label: "Finding restaurants…" },
                      ].map(({ Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
                        >
                          <Icon className="size-3 shrink-0" aria-hidden />
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground shadow-md">
                      <p className="mb-3 text-sm font-medium">Here&apos;s your Prague itinerary:</p>
                      <div className="space-y-2 text-xs text-primary-foreground/90">
                        <p className="font-semibold text-primary-foreground">Day 1</p>
                        <p>Flights BUH→PRG — Czech Airlines OK710 · €2,700</p>
                        <p>Check-in: Hilton Prague · €3,800 (2 nights)</p>
                        <p>Dinner: Lokál Dlouhááá · €900</p>
                        <p className="mt-2 font-semibold text-primary-foreground">Day 2</p>
                        <p>Prague Castle & Old Town Tour · €960</p>
                        <p>Kayaking on the Vltava River · €900</p>
                        <p className="mt-2 border-t border-primary-foreground/25 pt-2 font-semibold text-primary-foreground">
                          Total estimated: €7,560 · €440 under budget
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Brain className="size-4" aria-hidden />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/50 py-24">
        <div className="container-app max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            What HR leaders say
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                quote:
                  "TravelOps cut our quarterly offsite planning from 3 days to under an hour. The Finance Agent's budget tracking alone saved us from a €4,000 overrun on our last company retreat.",
                author: "Sarah Mitchell",
                role: "Head of People Operations",
                company: "Accenture Central Europe",
                stars: 5,
              },
              {
                quote:
                  "We manage 200+ business trips per year. TravelOps replaced four separate tools and our finance team finally has real-time visibility. The invoice OCR is a game-changer.",
                author: "Thomas Berger",
                role: "Senior HR Manager",
                company: "Deutsche Bank",
                stars: 5,
              },
            ].map(({ quote, author, role, company, stars }) => (
              <Card key={author} className="border-border shadow-sm transition-shadow duration-200 hover:shadow-md">
                <CardContent className="p-8">
                  <div className="mb-4 flex">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    ))}
                  </div>
                  <p className="mb-6 italic leading-relaxed text-foreground/90">
                    &quot;{quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-4 text-sm font-bold text-primary-foreground shadow-sm">
                      {author.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{author}</div>
                      <div className="text-xs text-muted-foreground">
                        {role} · {company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="pricing"
        className="bg-gradient-to-br from-primary via-primary to-chart-4 py-24 text-white"
      >
        <div className="container-app max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to transform corporate travel planning?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/90">
            Start your free trial today. No credit card required. Two AI agents ready to plan your next corporate event in minutes.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/dashboard/events/new" className="cursor-pointer">
              <Button
                size="lg"
                className="h-14 cursor-pointer gap-2 bg-white px-10 text-lg font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-white/90"
              >
                Start planning for free
                <ArrowRight className="size-5" aria-hidden />
              </Button>
            </Link>
            <Link href="/dashboard" className="cursor-pointer">
              <Button
                size="lg"
                variant="outline"
                className="h-14 cursor-pointer border-white/50 bg-transparent px-10 text-lg text-white transition-colors duration-200 hover:bg-white/15"
              >
                View dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/85">
            {[
              "Free during beta",
              "Two AI agents included",
              "Invoice OCR processing",
              "Real-time budget tracking",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground py-12 text-background">
        <div className="container-app">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-background text-foreground shadow-sm">
                <Plane className="size-4" aria-hidden />
              </div>
              <span className="text-xl font-bold tracking-tight">TravelOps</span>
            </div>
            <p className="text-center text-sm italic text-background/75 md:text-left">
              The command center for corporate travel
            </p>
            <div className="flex gap-6 text-sm text-background/70">
              <a
                href="#"
                className="cursor-pointer transition-colors duration-200 hover:text-background"
              >
                Privacy
              </a>
              <a
                href="#"
                className="cursor-pointer transition-colors duration-200 hover:text-background"
              >
                Terms
              </a>
              <a
                href="#"
                className="cursor-pointer transition-colors duration-200 hover:text-background"
              >
                Contact
              </a>
            </div>
          </div>
          <Separator className="my-6 bg-background/15" />
          <p className="text-center text-xs text-background/60">
            © 2026 TravelOps. Planning + Finance agents via Google Gemini (set{" "}
            <code className="rounded bg-background/15 px-1 font-mono text-[0.7rem]">
              GOOGLE_GENERATIVE_AI_MODEL
            </code>{" "}
            if your free tier blocks a model).
          </p>
        </div>
      </footer>
    </div>
  );
}
