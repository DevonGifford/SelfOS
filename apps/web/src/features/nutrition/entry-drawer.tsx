import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ApiError } from "@/data/http";
import type { FoodEntry } from "@/data/schemas/food-entries";
import { useDeleteFoodEntry, useUpdateFoodEntry } from "@/features/nutrition/use-food-entry-mutations";
import { validateQuantity } from "@/features/nutrition/validate";

type EntryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FoodEntry;
};

// Quantity-only edit + delete — mirrors MeasurementDrawer's single
// edit-or-delete surface (decision 15). Not name/food-reselection; the
// API's PATCH only accepts quantity (decision 14).
export function EntryDrawer({ open, onOpenChange, entry }: EntryDrawerProps) {
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateFoodEntry();
  const deleteMutation = useDeleteFoodEntry();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validateQuantity(quantity);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateMutation.mutate(
      { id: entry.id, quantity: Number(quantity) },
      {
        onError: (error) => {
          if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
            setErrors(error.fieldErrors);
          }
        },
        onSuccess: () => onOpenChange(false),
      },
    );
  }

  function handleDelete() {
    deleteMutation.mutate(entry.id);
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{entry.name}</DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label
              htmlFor="edit-entry-quantity"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Quantity
            </label>
            <input
              id="edit-entry-quantity"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
            {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>}
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              Save
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
