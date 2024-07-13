import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkoutSession } from "@/data/schemas/workout-sessions";

function toTimeInput(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function fromTimeInput(base: Date, value: string) {
  const [h, m] = value.split(":").map(Number);
  const next = new Date(base);
  next.setHours(h, m, 0, 0);
  return next;
}

// The workout-level "..." menu — a Session's own start/finish times are
// user-correctable (ticket 03), e.g. fixing a bogus duration after a
// crash. `createdAt` doubles as "started at" (ADR 0003: Sessions persist
// from Start).
export function SessionMenu({
  session,
  onAddNote,
  onAdjustTimes,
}: {
  session: WorkoutSession;
  onAddNote: () => void;
  onAdjustTimes: (startedAt: string, finishedAt: string | null) => void;
}) {
  const [timesOpen, setTimesOpen] = useState(false);
  const startedAt = new Date(session.createdAt);
  const finishedAt = session.finishedAt ? new Date(session.finishedAt) : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="whitespace-nowrap" onClick={onAddNote}>
            Add note
          </DropdownMenuItem>
          <DropdownMenuItem className="whitespace-nowrap" onClick={() => setTimesOpen(true)}>
            Adjust start/end time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={timesOpen} onOpenChange={setTimesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust start/end time</DialogTitle>
          </DialogHeader>

          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">Start</span>
            <input
              type="time"
              defaultValue={toTimeInput(startedAt)}
              onChange={(e) =>
                onAdjustTimes(fromTimeInput(startedAt, e.target.value).toISOString(), session.finishedAt)
              }
              className="mt-1 w-full rounded-lg border bg-transparent px-2 py-1.5"
            />
          </label>

          {finishedAt ? (
            <label className="block text-sm">
              <span className="text-xs text-muted-foreground">Finish</span>
              <input
                type="time"
                defaultValue={toTimeInput(finishedAt)}
                onChange={(e) =>
                  onAdjustTimes(session.createdAt, fromTimeInput(finishedAt, e.target.value).toISOString())
                }
                className="mt-1 w-full rounded-lg border bg-transparent px-2 py-1.5"
              />
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">Finish time isn't set until you finish the workout.</p>
          )}

          <DialogFooter>
            <DialogClose render={<Button />}>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
