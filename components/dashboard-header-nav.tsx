"use client";

import Link from "next/link";
import { CreditCard, LayoutDashboard, Plane, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { TravelopsActorSettings } from "@/components/travelops-actor-settings";
import { cn } from "@/lib/utils";

export function DashboardBrandLink() {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={240}
        render={
          <Link
            href="/dashboard"
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        }
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Plane className="size-4" aria-hidden />
        </div>
        <span className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          TravelOps
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">Events dashboard home</TooltipContent>
    </Tooltip>
  );
}

export function DashboardHeaderNav() {
  return (
    <nav
      className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2"
      aria-label="Dashboard"
    >
      <Tooltip>
        <TooltipTrigger
          delay={280}
          render={
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden cursor-pointer text-muted-foreground hover:text-foreground sm:inline-flex"
              )}
            />
          }
        >
          Home
        </TooltipTrigger>
        <TooltipContent side="bottom">Back to marketing home</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          delay={280}
          render={
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "cursor-pointer gap-2 text-muted-foreground hover:text-foreground"
              )}
            />
          }
        >
          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Events</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">All corporate events</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          delay={280}
          render={
            <Link
              href="/dashboard/billing"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden cursor-pointer gap-2 text-muted-foreground hover:text-foreground sm:inline-flex"
              )}
            />
          }
        >
          <CreditCard className="size-4 shrink-0" aria-hidden />
          Billing
        </TooltipTrigger>
        <TooltipContent side="bottom">Billing and subscription</TooltipContent>
      </Tooltip>

      <TravelopsActorSettings />
      <ThemeToggle />

      <Tooltip>
        <TooltipTrigger
          delay={280}
          render={
            <Link
              href="/dashboard/events/new"
              className={cn(
                buttonVariants({ size: "sm" }),
                "cursor-pointer gap-2 bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              )}
            />
          }
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">New event</span>
          <span className="sm:hidden">New</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Create a new trip or offsite</TooltipContent>
      </Tooltip>
    </nav>
  );
}
