"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function LandingHeaderActions() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ThemeToggle />
      <Tooltip>
        <TooltipTrigger
          delay={260}
          render={
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "cursor-pointer text-muted-foreground hover:text-foreground"
              )}
            />
          }
        >
          Sign in
        </TooltipTrigger>
        <TooltipContent side="bottom">Open the planner dashboard</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          delay={260}
          render={
            <Link
              href="/dashboard/events/new"
              className={cn(
                buttonVariants({ size: "sm" }),
                "cursor-pointer bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              )}
            />
          }
        >
          Start free trial
        </TooltipTrigger>
        <TooltipContent side="bottom">Create your first corporate event</TooltipContent>
      </Tooltip>
    </div>
  );
}
