// PROTOTYPE — shared Command-based picker for both "Add Exercise" and
// "Replace exercise". A shadcn CommandDialog: searchable, dismissable
// without side effects (Escape / outside click / its own Cancel affordance
// all just close it), with a "+ New Exercise" fallback so the user is never
// limited to the static catalog. Answers ticket 02's shadcn refinement pass.

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
import type { Exercise } from "@/features/training-prototype/fixtures";

export function ExercisePicker({
  open,
  onOpenChange,
  title,
  options,
  onSelect,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onCreate: (name: string) => void;
}) {
  const [search, setSearch] = useState("");

  function choose(exercise: Exercise) {
    onSelect(exercise);
    setSearch("");
    onOpenChange(false);
  }

  function create() {
    if (!search.trim()) return;
    onCreate(search.trim());
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
