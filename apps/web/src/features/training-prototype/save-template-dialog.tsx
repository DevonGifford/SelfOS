// PROTOTYPE — the "save as new template" form (Type / Name / Save). Type is
// locked when the session already has a real Workout Type; a Freestyle
// session has no Workout Type of its own, so Type becomes a required choice
// instead. Answers ticket 04 on .scratch/training-feature/map.md.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkoutType } from "@/features/training-prototype/fixtures";
import { WORKOUT_TYPE_LABEL } from "@/features/training-prototype/fixtures";
import type { ActionResult } from "@/features/training-prototype/use-workout-session-state";

const WORKOUT_TYPES: WorkoutType[] = ["push", "pull", "legs", "cardio"];

export function SaveTemplateDialog({
  open,
  onOpenChange,
  fixedWorkoutType,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A real Workout Type locks the field; null means the session was
   * Freestyle and has no Workout Type of its own to inherit — the user
   * must pick one, since a Template can never belong to Freestyle. */
  fixedWorkoutType: WorkoutType | null;
  onSave: (type: WorkoutType, name: string) => ActionResult;
}) {
  const [type, setType] = useState<WorkoutType>(fixedWorkoutType ?? "push");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setType(fixedWorkoutType ?? "push");
      setName("");
      setError(null);
    }
  }

  function save() {
    const result = onSave(type, name);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Template</DialogTitle>
        </DialogHeader>

        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          {fixedWorkoutType ? (
            <p className="mt-1 text-sm font-medium">{WORKOUT_TYPE_LABEL[fixedWorkoutType]}</p>
          ) : (
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WorkoutType)}
              className="mt-1 h-8 w-full rounded-lg border bg-transparent px-2 text-sm"
            >
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORKOUT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Heavy"
            className="mt-1"
          />
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
