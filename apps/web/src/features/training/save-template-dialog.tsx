import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WORKOUT_TYPE_LABEL } from "@/features/training/labels";
import { useSaveAsTemplate } from "@/features/training/use-workout-sessions";
import type { WorkoutType } from "@/data/schemas/training-shared";

const WORKOUT_TYPES: WorkoutType[] = ["push", "pull", "legs", "cardio"];

// The "save as new template" form. Type is locked when the session already
// has a real Workout Type; a Freestyle session has none of its own, so
// Type becomes a required choice instead.
export function SaveTemplateDialog({
  open,
  onOpenChange,
  sessionId,
  fixedWorkoutType,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  fixedWorkoutType: WorkoutType | null;
  onSaved: (name: string) => void;
}) {
  const [type, setType] = useState<WorkoutType>(fixedWorkoutType ?? "push");
  const [name, setName] = useState("");
  const saveMutation = useSaveAsTemplate();

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setType(fixedWorkoutType ?? "push");
      setName("");
      saveMutation.reset();
    }
  }

  function save() {
    saveMutation.mutate(
      { sessionId, workoutType: type, name: name.trim() },
      {
        onSuccess: () => {
          onSaved(name.trim());
          onOpenChange(false);
        },
      },
    );
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

        {saveMutation.isError ? <p className="text-xs text-destructive">{saveMutation.error.message}</p> : null}

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button disabled={!name.trim() || saveMutation.isPending} onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
