import Link from "next/link";
import { Plane, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30 dark:bg-background">
      <div className="sticky top-0 z-40 pt-3 pb-0 sm:pt-4">
        <header className="glass-header container-app rounded-2xl border shadow-sm">
          <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
            <Link
              href="/dashboard"
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Plane className="size-4" aria-hidden />
              </div>
              <span className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                TravelOps
              </span>
            </Link>
            <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Link href="/" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LayoutDashboard className="size-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Events</span>
                </Button>
              </Link>
              <ThemeToggle />
              <Link href="/dashboard/events/new">
                <Button
                  size="sm"
                  className="cursor-pointer gap-2 bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Plus className="size-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">New event</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>
            </nav>
          </div>
        </header>
      </div>
      <main className="container-app flex-1 py-8 sm:py-10">{children}</main>
    </div>
  );
}
