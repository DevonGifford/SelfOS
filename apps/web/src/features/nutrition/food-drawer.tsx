import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ApiError } from "@/data/http";
import type { Food, Foods } from "@/data/schemas/foods";
import { useCreateFoodEntry } from "@/features/nutrition/use-food-entry-mutations";
import { useCreateFood } from "@/features/nutrition/use-food-mutations";
import {
  validateFoodName,
  validateQuantity,
  validateServingLabel,
} from "@/features/nutrition/validate";

type FoodDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foods: Foods;
  date: string;
};

// The brief's own 6-step flow (decision 15), implemented as written:
// search-as-you-type over already-fetched foods, select one or "Create
// new food," set quantity, log. Remounted via `key` on each open, same
// pattern as MeasurementDrawer/HabitDrawer.
export function FoodDrawer({ open, onOpenChange, foods, date }: FoodDrawerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Food | undefined>(undefined);
  const [creatingNew, setCreatingNew] = useState(false);
  const [quantity, setQuantity] = useState("1");

  const [name, setName] = useState("");
  const [servingLabel, setServingLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createFood = useCreateFood();
  const createEntry = useCreateFoodEntry();

  const matches =
    search.trim() === ""
      ? []
      : foods.filter((food) => food.name.toLowerCase().includes(search.trim().toLowerCase()));

  function handleLogExisting(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;

    const validationErrors = validateQuantity(quantity);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    createEntry.mutate(
      { foodId: selected.id, quantity: Number(quantity), date },
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

  function handleCreateAndLog(event: FormEvent) {
    event.preventDefault();

    const validationErrors = {
      ...validateFoodName(name),
      ...validateServingLabel(servingLabel),
      ...validateQuantity(quantity),
    };
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    createFood.mutate(
      {
        name,
        servingLabel,
        caloriesPerServing: Number(calories) || 0,
        proteinPerServing: Number(protein) || 0,
        carbsPerServing: Number(carbs) || 0,
        fatPerServing: Number(fat) || 0,
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
            setErrors(error.fieldErrors);
          }
        },
        onSuccess: (food) => {
          createEntry.mutate(
            { foodId: food.id, quantity: Number(quantity), date },
            { onSuccess: () => onOpenChange(false) },
          );
        },
      },
    );
  }

  const isSaving = createFood.isPending || createEntry.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Food</DrawerTitle>
        </DrawerHeader>

        {!selected && !creatingNew && (
          <div className="flex flex-col gap-3 p-4">
            <input
              type="text"
              placeholder="Search foods…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />

            {matches.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {matches.map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(food)}
                      className="flex w-full items-baseline justify-between rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    >
                      <span>{food.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {food.caloriesPerServing} kcal / {food.servingLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button type="button" variant="outline" onClick={() => setCreatingNew(true)}>
              + Create new food
            </Button>
          </div>
        )}

        {selected && (
          <form onSubmit={handleLogExisting} className="flex flex-col gap-4 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">{selected.name}</p>
              <button
                type="button"
                onClick={() => setSelected(undefined)}
                className="text-xs text-muted-foreground underline"
              >
                change
              </button>
            </div>

            <div>
              <label
                htmlFor="entry-quantity"
                className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
              >
                Quantity ({selected.servingLabel} = 1x)
              </label>
              <input
                id="entry-quantity"
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
              <Button type="submit" disabled={isSaving}>
                Log
              </Button>
            </DrawerFooter>
          </form>
        )}

        {creatingNew && (
          <form onSubmit={handleCreateAndLog} className="flex flex-col gap-4 p-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Serving (e.g. "1 bowl", "100g")
              </label>
              <input
                type="text"
                value={servingLabel}
                onChange={(event) => setServingLabel(event.target.value)}
                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              />
              {errors.servingLabel && (
                <p className="mt-1 text-xs text-destructive">{errors.servingLabel}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Calories
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={calories}
                  onChange={(event) => setCalories(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Protein (g)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={protein}
                  onChange={(event) => setProtein(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={carbs}
                  onChange={(event) => setCarbs(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Fat (g)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={fat}
                  onChange={(event) => setFat(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-food-quantity"
                className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
              >
                Quantity (1x = one serving above)
              </label>
              <input
                id="new-food-quantity"
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
              <Button type="submit" disabled={isSaving}>
                Save &amp; Log
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreatingNew(false)}>
                Back
              </Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
