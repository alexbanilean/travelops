import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TravelOps</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/dashboard/events/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Start free trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Zap className="w-3 h-3 mr-1" />
            Powered by AI Agents
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
            Corporate travel,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              reimagined
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            TravelOps is the command center for corporate travel — combining AI-powered planning, booking, and expense tracking into one streamlined system. Reduce planning time from days to minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard/events/new">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-14 px-8 text-lg gap-2">
                Start planning for free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                View demo
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            No credit card required · Free during beta
          </p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "85%", label: "Less planning time" },
              { value: "€1.4T", label: "Global corp. travel market" },
              { value: "2", label: "AI Agents working for you" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{value}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-12 border-y bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">
            Trusted by HR teams at Fortune 1000 companies
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-40">
            {["Accenture", "Deloitte", "McKinsey", "PwC", "KPMG", "EY"].map(
              (name) => (
                <span key={name} className="text-xl font-bold text-gray-400 tracking-tight">
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
              Two AI Agents
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Intelligence built into every step
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Two specialized AI agents work in concert to handle planning logistics and financial tracking — automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Planning Agent */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Agent 1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Planning Agent
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your AI travel concierge. Give it a destination, dates, headcount and budget — it searches flights, hotels, activities and restaurants, then builds a complete day-by-day itinerary.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Plane, text: "Flights" },
                    { icon: Hotel, text: "Hotels" },
                    { icon: Activity, text: "Activities" },
                    { icon: Utensils, text: "Restaurants" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3 h-3 text-blue-600" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Finance Agent */}
            <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-6">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Agent 2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Finance Agent
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your AI finance controller. It tracks budgets in real time, processes uploaded invoices via OCR, flags overspending risks, and keeps every euro accounted for.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: BarChart3, text: "Budget tracking" },
                    { icon: Receipt, text: "Invoice OCR" },
                    { icon: Shield, text: "Overspend alerts" },
                    { icon: CheckCircle, text: "Policy compliance" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3 h-3 text-emerald-600" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Minutes, not days",
                description:
                  "Generate a full 3-day corporate retreat itinerary with vendor options in under 2 minutes.",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: BarChart3,
                title: "Real-time dashboard",
                description:
                  "Live budget visualization with pie charts and spending timelines. Know your position at a glance.",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: Shield,
                title: "Policy compliance",
                description:
                  "Automatic flagging when spending approaches or exceeds approved budgets — before it's a problem.",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
            ].map(({ icon: Icon, title, description, color, bg }) => (
              <Card key={title} className="border border-gray-100">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From idea to itinerary in 3 steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              TravelOps makes corporate event planning effortless for HR teams of any size.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-blue-200" />

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
                <div className="absolute top-0 right-6 md:right-auto md:left-1/2 md:-translate-x-1/2 -translate-y-2 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See it in action
            </h2>
            <p className="text-gray-600">
              A real example: 20 people, 2 days in Prague, €8,000 budget
            </p>
          </div>
          <Card className="border-2 border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-gray-400 text-xs font-mono">TravelOps — Planning Agent</span>
            </div>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">HR</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                    <p className="text-sm text-gray-800">Plan a 2-day team building in Prague for 20 people with €8,000.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="space-y-2 max-w-lg">
                    <div className="flex gap-2 flex-wrap justify-end">
                      {[
                        "🔍 Searching flights...",
                        "🏨 Finding hotels...",
                        "🎯 Searching activities...",
                        "🍽️ Finding restaurants...",
                      ].map((label) => (
                        <span key={label} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm text-white font-medium mb-3">Here&apos;s your Prague itinerary:</p>
                      <div className="space-y-2 text-xs text-blue-100">
                        <p className="font-semibold text-white">Day 1</p>
                        <p>✈️ Flights BUH→PRG — Czech Airlines OK710 · €2,700</p>
                        <p>🏨 Check-in: Hilton Prague · €3,800 (2 nights)</p>
                        <p>🍺 Dinner: Lokál Dlouhááá · €900</p>
                        <p className="font-semibold text-white mt-2">Day 2</p>
                        <p>🏰 Prague Castle & Old Town Tour · €960</p>
                        <p>🚣 Kayaking on the Vltava River · €900</p>
                        <p className="font-semibold text-white mt-2 pt-2 border-t border-blue-500">Total estimated: €7,560 · €440 under budget ✓</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What HR leaders say
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
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
              <Card key={author} className="border border-gray-100">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    &quot;{quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{author}</div>
                      <div className="text-xs text-gray-500">{role} · {company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform corporate travel planning?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Start your free trial today. No credit card required. Two AI agents ready to plan your next corporate event in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/events/new">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 h-14 px-10 text-lg font-semibold gap-2">
                Start planning for free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-14 px-10 text-lg">
                View dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-blue-200 text-sm">
            {[
              "Free during beta",
              "Two AI agents included",
              "Invoice OCR processing",
              "Real-time budget tracking",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TravelOps</span>
            </div>
            <p className="text-sm text-gray-500 italic">
              "The command center for corporate travel"
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
            </div>
          </div>
          <Separator className="my-6 bg-gray-800" />
          <p className="text-center text-xs text-gray-600">
            © 2026 TravelOps. Built with AI — Planning Agent + Finance Agent powered by Google Gemini 2.0 Flash.
          </p>
        </div>
      </footer>
    </div>
  );
}
