"use client";

import type { ReactNode } from "react";
import { AssistantUiProvider, useAssistantUi } from "@/components/assistant-ui-context";
import { DashboardAssistantRail } from "@/components/dashboard-assistant-rail";
import { DashboardBrandLink, DashboardHeaderNav } from "@/components/dashboard-header-nav";
import { cn } from "@/lib/utils";

function DashboardShellChrome({ children }: { children: ReactNode }) {
  const { railCollapsed } = useAssistantUi();

  return (
    <div
      className={cn(
        "flex w-full min-h-0 flex-1 flex-col bg-muted/30 dark:bg-background",
        "min-h-dvh",
        /* Desktop: fixed app height — main scrolls, rail is its own column (no document trap). */
        "lg:grid lg:h-[100dvh] lg:max-h-[100dvh] lg:min-h-0 lg:flex-none lg:overflow-hidden",
        "lg:grid-rows-[auto_minmax(0,1fr)] lg:items-stretch",
        railCollapsed
          ? "lg:grid-cols-[minmax(0,1fr)_3.5rem]"
          : "lg:grid-cols-[minmax(0,1fr)_minmax(14rem,min(24rem,36vw))]"
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-40 shrink-0 pt-3 pb-0 sm:pt-4",
          "lg:col-start-1 lg:row-start-1 lg:self-start"
        )}
      >
        <header className="glass-header container-app rounded-2xl border shadow-sm">
          <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
            <DashboardBrandLink />
            <DashboardHeaderNav />
          </div>
        </header>
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          "lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:max-h-full lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-y-contain"
        )}
      >
        <main className="container-app flex min-h-0 min-w-0 flex-1 flex-col py-8 sm:py-10">
          {children}
        </main>
      </div>

      <DashboardAssistantRail />
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AssistantUiProvider>
      <DashboardShellChrome>{children}</DashboardShellChrome>
    </AssistantUiProvider>
  );
}
