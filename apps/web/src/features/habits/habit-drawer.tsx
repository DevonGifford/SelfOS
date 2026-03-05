import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ApiError } from "@/data/http";
import type { Habit, Habits } from "@/data/schemas/habits";
import { useCreateHabit, useUpdateHabit } from "@/features/habits/use-habit-mutations";
import { validateActiveChange, validateName } from "@/features/habits/validate";

type HabitDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
  habits: Habits;
};

// Remounted via `key` on each open (measurement-drawer.tsx's pattern) —
// plain useState initializers reset the form, no effect needed.
export function HabitDrawer({ open, onOpenChange, habit, habits }: HabitDrawerProps) {
  const isEdit = habit !== undefined;

  const [name, setName] = useState(habit?.name ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validateName(name);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const onMutationError = (error: unknown) => {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      }
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: habit.id, input: { name } },
        { onError: onMutationError, onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(name, {
        onError: onMutationError,
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  // Same path the Edit Habits row's quick-archive action uses (validate,
  // then updateMutation with active:false) — there's no reactivation
  // surface anywhere in the app, so this is a one-way action, not a toggle
  // riding along with Save.
  function handleArchive() {
    if (!isEdit) return;

    const activeCount = habits.filter((h) => h.active).length;
    const activeErrors = validateActiveChange(false, habit.active, activeCount);
    if (activeErrors.active) {
      setErrors(activeErrors);
      return;
    }

    updateMutation.mutate(
      { id: habit.id, input: { active: false } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? "Edit Habit" : "Add Habit"}</DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label
              htmlFor="habit-name"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Name
            </label>
            <input
              id="habit-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            {isEdit && (
              <p className="mt-1 text-xs text-muted-foreground">
                Renaming updates this habit&rsquo;s label. For a genuinely different habit, archive
                this one and create a new habit instead.
              </p>
            )}
          </div>

          {isEdit && (
            <div>
              <Button type="button" variant="destructive" size="sm" onClick={handleArchive} disabled={isSaving}>
                Archive habit
              </Button>
              {errors.active && <p className="mt-1 text-xs text-destructive">{errors.active}</p>}
            </div>
          )}

          <DrawerFooter>
            <Button type="submit" disabled={isSaving}>
              Save
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
