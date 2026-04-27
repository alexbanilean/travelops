"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const RAIL_COLLAPSED_KEY = "travelops:assistant-rail-collapsed";

type AssistantUiContextValue = {
  mobileRailOpen: boolean;
  setMobileRailOpen: (open: boolean) => void;
  /** Incremented so the rail can focus the composer (e.g. from itinerary banner). */
  focusComposerTick: number;
  requestRailComposerFocus: () => void;
  /** Desktop lg+ rail width; persisted in localStorage. */
  railCollapsed: boolean;
  setRailCollapsed: (collapsed: boolean) => void;
  toggleRailCollapsed: () => void;
};

const AssistantUiContext = createContext<AssistantUiContextValue | null>(null);

export function AssistantUiProvider({ children }: { children: ReactNode }) {
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [focusComposerTick, setFocusComposerTick] = useState(0);
  const [railCollapsed, setRailCollapsedState] = useState(false);

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(RAIL_COLLAPSED_KEY);
      if (raw === "1") setRailCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setRailCollapsed = useCallback((collapsed: boolean) => {
    setRailCollapsedState(collapsed);
    try {
      localStorage.setItem(RAIL_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleRailCollapsed = useCallback(() => {
    setRailCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RAIL_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const requestRailComposerFocus = useCallback(() => {
    setFocusComposerTick((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({
      mobileRailOpen,
      setMobileRailOpen,
      focusComposerTick,
      requestRailComposerFocus,
      railCollapsed,
      setRailCollapsed,
      toggleRailCollapsed,
    }),
    [
      mobileRailOpen,
      focusComposerTick,
      requestRailComposerFocus,
      railCollapsed,
      setRailCollapsed,
      toggleRailCollapsed,
    ]
  );

  return (
    <AssistantUiContext.Provider value={value}>{children}</AssistantUiContext.Provider>
  );
}

export function useAssistantUi(): AssistantUiContextValue {
  const ctx = useContext(AssistantUiContext);
  if (!ctx) {
    throw new Error("useAssistantUi must be used within AssistantUiProvider");
  }
  return ctx;
}
