// PROTOTYPE — the workout-level "..." menu. Rebuilt on shadcn's
// DropdownMenu (was a hand-rolled absolutely-positioned div with no
// outside-click dismissal). Same two actions as before: Add note, Adjust
// start/end time — room for a future Rename workout item, not added yet.
// Answers ticket 02's shadcn refinement pass.

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { useWorkoutSessionState } from "@/features/training-prototype/use-workout-session-state";

function toTimeInput(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function fromTimeInput(base: Date, value: string) {
  const [h, m] = value.split(":").map(Number);
  const next = new Date(base);
  next.setHours(h, m, 0, 0);
  return next;
}

export function SessionMenu({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [timesOpen, setTimesOpen] = useState(false);

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
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setNoteOpen(true)}>Add note</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTimesOpen(true)}>Adjust start/end time</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session note</DialogTitle>
          </DialogHeader>
          <Textarea
            autoFocus
            value={s.sessionNote}
            onChange={(e) => s.setSessionNote(e.target.value)}
            placeholder="Session note…"
            rows={3}
          />
          <DialogFooter>
            <DialogClose render={<Button />}>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={timesOpen} onOpenChange={setTimesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust start/end time</DialogTitle>
          </DialogHeader>

          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">Start</span>
            <input
              type="time"
              defaultValue={s.startedAt ? toTimeInput(s.startedAt) : ""}
              onChange={(e) => s.adjustTimes(fromTimeInput(s.startedAt ?? new Date(), e.target.value), s.finishedAt)}
              className="mt-1 w-full rounded-lg border bg-transparent px-2 py-1.5"
            />
          </label>

          {s.finishedAt ? (
            <label className="block text-sm">
              <span className="text-xs text-muted-foreground">Finish</span>
              <input
                type="time"
                defaultValue={toTimeInput(s.finishedAt)}
                onChange={(e) =>
                  s.adjustTimes(s.startedAt ?? new Date(), fromTimeInput(s.finishedAt ?? new Date(), e.target.value))
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
