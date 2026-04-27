"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>;
}

type TooltipTriggerProps = TooltipPrimitive.Trigger.Props;

function TooltipTrigger({ className, ...props }: TooltipTriggerProps) {
  return (
    <TooltipPrimitive.Trigger
      className={cn("cursor-default outline-none", className)}
      {...props}
    />
  );
}

type TooltipContentProps = Omit<
  React.ComponentProps<typeof TooltipPrimitive.Popup>,
  "children"
> & {
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  children: React.ReactNode;
  className?: string;
};

function TooltipContent({
  className,
  side = "bottom",
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        className="z-200 isolate"
      >
        <TooltipPrimitive.Popup
          className={cn(
            "max-w-xs rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-lg ring-1 ring-foreground/5",
            "origin-(--transform-origin) transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 data-open:scale-100 data-open:opacity-100 motion-reduce:transition-none",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
