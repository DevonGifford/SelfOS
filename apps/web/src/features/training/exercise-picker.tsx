import { useState } from "react";
import { Plus } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { WORKOUT_TYPE_LABEL } from "@/features/training/labels";
import type { Exercise } from "@/data/schemas/exercises";
import type { WorkoutType } from "@/data/schemas/training-shared";

const WORKOUT_TYPES: WorkoutType[] = ["push", "pull", "legs", "cardio"];

// Shared Command-based picker for both "Add Exercise" and "Replace
// exercise". A shadcn CommandDialog: searchable, dismissable without side
// effects, with a "+ New Exercise" fallback so the user is never limited
// to the existing catalog.
export function ExercisePicker({
  open,
  onOpenChange,
  title,
  options,
  workoutType,
  onSelect,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: Exercise[];
  /** A real Workout Type is used for a newly created Exercise directly; a
   * Freestyle session (null) has no type of its own to inherit, so the
   * create row asks for one. */
  workoutType: WorkoutType | null;
  onSelect: (exercise: Exercise) => void;
  onCreate: (name: string, workoutType: WorkoutType) => void;
}) {
  const [search, setSearch] = useState("");
  const [createType, setCreateType] = useState<WorkoutType>(workoutType ?? "push");

  function choose(exercise: Exercise) {
    onSelect(exercise);
    setSearch("");
    onOpenChange(false);
  }

  function create() {
    if (!search.trim()) return;
    onCreate(search.trim(), workoutType ?? createType);
    setSearch("");
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSearch("");
      }}
      title={title}
      description="Search exercises or create a new one"
    >
      <Command shouldFilter>
        <CommandInput placeholder="Search exercises…" value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>No matching exercises.</CommandEmpty>
          <CommandGroup heading="Exercises">
            {options.map((exercise) => (
              <CommandItem key={exercise.id} value={exercise.name} onSelect={() => choose(exercise)}>
                {exercise.name}
              </CommandItem>
            ))}
          </CommandGroup>
          {search.trim() ? (
            <CommandGroup heading="Create">
              {workoutType === null ? (
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  {WORKOUT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCreateType(t)}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        createType === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {WORKOUT_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              ) : null}
              <CommandItem value={`create-${search}`} onSelect={create}>
                <Plus className="size-4" />
                New Exercise: "{search.trim()}"
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
