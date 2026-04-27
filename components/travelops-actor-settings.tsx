"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getActorNameFromStorage,
  setActorNameInStorage,
} from "@/lib/browser-actor";
import { UserRound } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact header control: opens a dialog so the bar stays aligned on all breakpoints
 * (audit name is sent as `x-travelops-actor` on API calls from `actorHeaders()`).
 */
export function TravelopsActorSettings() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Guest");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) setName(getActorNameFromStorage());
  }, [open]);

  const save = () => {
    setActorNameInStorage(name);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger
          render={
            <TooltipTrigger
              delay={320}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Set your display name for the activity log"
                />
              }
            />
          }
        >
          <UserRound className="size-4" aria-hidden />
        </DialogTrigger>
        <TooltipContent side="bottom">
          Display name for comments, approvals, and audit (stored in this browser)
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your display name</DialogTitle>
          <DialogDescription>
            Used in comments, approvals, and audit entries. Stored only in this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-2">
            <Label htmlFor="travelops-actor-name">Name</Label>
            <Input
              id="travelops-actor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              maxLength={120}
              autoComplete="name"
            />
          </div>
          {saved && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              Saved.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button type="button" onClick={save}>
            Save name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
