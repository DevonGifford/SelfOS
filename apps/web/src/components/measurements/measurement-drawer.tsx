import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ApiError } from "@/data/api-client";
import type { WeightEntry } from "@/data/schemas/weight";
import {
  useCreateMeasurement,
  useDeleteMeasurement,
  useUpdateMeasurement,
} from "@/features/measurements/use-measurement-mutations";

type MeasurementDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: WeightEntry;
};

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validate(date: string, kg: string): Record<string, string> {
  const errors: Record<string, string> = {};

  const kgNumber = Number(kg);
  if (kg.trim() === "" || Number.isNaN(kgNumber) || kgNumber <= 0) {
    errors.kg = "must be positive";
  }

  if (date.trim() === "") {
    errors.date = "required";
  } else if (date > todayString()) {
    errors.date = "cannot be in the future";
  }

  return errors;
}

// The caller remounts this component (via `key`) each time the drawer
// opens, so plain useState initializers are enough to reset the form —
// no effect needed to sync state on every open.
export function MeasurementDrawer({ open, onOpenChange, entry }: MeasurementDrawerProps) {
  const isEdit = entry !== undefined;

  const [date, setDate] = useState(entry?.date ?? todayString());
  const [kg, setKg] = useState(entry ? String(entry.kg) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateMeasurement();
  const updateMutation = useUpdateMeasurement();
  const deleteMutation = useDeleteMeasurement();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validate(date, kg);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const input = { date, kg: Number(kg) };
    const onMutationError = (error: unknown) => {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      }
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: entry.id, input },
        { onError: onMutationError, onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(input, {
        onError: onMutationError,
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  function handleDelete() {
    if (!entry) return;
    deleteMutation.mutate(entry.id);
    onOpenChange(false);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? "Edit Weight" : "Log Weight"}</DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label
              htmlFor="measurement-date"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Date
            </label>
            <input
              id="measurement-date"
              type="date"
              value={date}
              max={todayString()}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
            {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date}</p>}
          </div>

          <div>
            <label
              htmlFor="measurement-kg"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Weight (kg)
            </label>
            <input
              id="measurement-kg"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={kg}
              onChange={(event) => setKg(event.target.value)}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
            {errors.kg && <p className="mt-1 text-xs text-destructive">{errors.kg}</p>}
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={isSaving}>
              Save
            </Button>
            {isEdit && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
