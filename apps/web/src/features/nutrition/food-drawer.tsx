import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ApiError } from "@/data/http";
import type { MealSlot } from "@/data/schemas/food-entries";
import type { Food, Foods } from "@/data/schemas/foods";
import { MacroAdjustmentFields } from "@/features/nutrition/macro-adjustment-fields";
import { MealSlotSelect } from "@/features/nutrition/meal-slot-select";
import { SaveEntryActions } from "@/features/nutrition/save-entry-actions";
import { useCreateFoodEntry } from "@/features/nutrition/use-food-entry-mutations";
import { useCreateFood, useUpdateFood } from "@/features/nutrition/use-food-mutations";
import { useMacroAdjustment } from "@/features/nutrition/use-macro-adjustment";
import {
  validateFoodName,
  validateQuantity,
  validateServingLabel,
} from "@/features/nutrition/validate";

// A rough time-of-day guess, not a rule — the user can always override it,
// which is the whole point of asking rather than auto-assigning silently.
function defaultMealSlot(now = new Date()): MealSlot {
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < 10.5) return "breakfast";
  if (hour < 11.5) return "snack";
  if (hour < 14.5) return "lunch";
  if (hour < 17.5) return "tea";
  return "dinner";
}

type FoodDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foods: Foods;
  date: string;
};

// Keeps the label's main word visually prominent while a trailing
// parenthetical (unit, example) reads as quieter secondary helper text.
function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {children}
      {hint && <span className="ml-1 text-[10px] tracking-normal text-muted-foreground/50">{hint}</span>}
    </label>
  );
}

type SelectedFoodAdjustmentProps = {
  food: Food;
  date: string;
  onChange: () => void;
  onDone: () => void;
};

// Adding an existing Food = configuring its entry before it exists; editing
// a logged one (EntryDrawer) = configuring it after. Same adjustment
// mechanics (useMacroAdjustment, MacroAdjustmentFields, SaveEntryActions,
// MealSlotSelect) via the shared Nutrition-domain pieces, with the create
// semantics: each save action ends in creating a new FoodEntry rather than
// patching an existing one.
function SelectedFoodAdjustment({ food, date, onChange, onDone }: SelectedFoodAdjustmentProps) {
  const baseRates = {
    calories: food.caloriesPerServing,
    protein: food.proteinPerServing,
    carbs: food.carbsPerServing,
    fat: food.fatPerServing,
  };
  const { quantity, nudgeQuantity, nudgeMacro, resolvedMacros } = useMacroAdjustment(baseRates, 1);
  const [mealSlot, setMealSlot] = useState<MealSlot>(defaultMealSlot());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createEntry = useCreateFoodEntry();
  const updateFoodMutation = useUpdateFood();
  const createFoodMutation = useCreateFood();

  function withValidQuantity(action: () => void) {
    const validationErrors = validateQuantity(String(quantity));
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    action();
  }

  function logOnce() {
    withValidQuantity(() => {
      const r = resolvedMacros();
      createEntry.mutate({ foodId: food.id, date, mealSlot, ...r }, { onSuccess: onDone });
    });
  }

  function updateFoodAndLog() {
    withValidQuantity(() => {
      const r = resolvedMacros();
      updateFoodMutation.mutate(
        {
          id: food.id,
          input: {
            caloriesPerServing: r.calories / r.quantity,
            proteinPerServing: r.protein / r.quantity,
            carbsPerServing: r.carbs / r.quantity,
            fatPerServing: r.fat / r.quantity,
          },
        },
        {
          onSuccess: () => {
            createEntry.mutate({ foodId: food.id, date, mealSlot, ...r }, { onSuccess: onDone });
          },
        },
      );
    });
  }

  function saveAsNewFoodAndLog() {
    withValidQuantity(() => {
      const r = resolvedMacros();
      createFoodMutation.mutate(
        {
          name: food.name,
          servingLabel: food.servingLabel,
          caloriesPerServing: r.calories / r.quantity,
          proteinPerServing: r.protein / r.quantity,
          carbsPerServing: r.carbs / r.quantity,
          fatPerServing: r.fat / r.quantity,
        },
        {
          onSuccess: (newFood) => {
            createEntry.mutate({ foodId: newFood.id, date, mealSlot, ...r }, { onSuccess: onDone });
          },
        },
      );
    });
  }

  const isSaving = createEntry.isPending || updateFoodMutation.isPending || createFoodMutation.isPending;
  const macros = resolvedMacros();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{food.name}</p>
        <button type="button" onClick={onChange} className="text-xs text-muted-foreground underline">
          change
        </button>
      </div>

      <MacroAdjustmentFields
        servingLabel={food.servingLabel}
        quantity={quantity}
        macros={macros}
        onNudgeQuantity={nudgeQuantity}
        onNudgeMacro={nudgeMacro}
        quantityError={errors.quantity}
      />

      <div className="border-t pt-4">
        <MealSlotSelect value={mealSlot} onChange={setMealSlot} />
      </div>

      <SaveEntryActions
        onLogOnce={logOnce}
        onUpdateFood={updateFoodAndLog}
        onSaveAsNewFood={saveAsNewFoodAndLog}
        disabled={isSaving}
      />
    </div>
  );
}

// The brief's own 6-step flow (decision 15), implemented as written:
// search-as-you-type over already-fetched foods, select one or "Create
// new food," set quantity, log. Remounted via `key` on each open, same
// pattern as MeasurementDrawer/HabitDrawer.
export function FoodDrawer({ open, onOpenChange, foods, date }: FoodDrawerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Food | undefined>(undefined);
  const [creatingNew, setCreatingNew] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [mealSlot, setMealSlot] = useState<MealSlot>(defaultMealSlot());

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
            { foodId: food.id, quantity: Number(quantity), date, mealSlot },
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
          <SelectedFoodAdjustment
            food={selected}
            date={date}
            onChange={() => setSelected(undefined)}
            onDone={() => onOpenChange(false)}
          />
        )}

        {creatingNew && (
          <form onSubmit={handleCreateAndLog} className="flex flex-col gap-4 p-4">
            <div>
              <FieldLabel>Name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>

            <div>
              <FieldLabel hint={'(e.g. "1 bowl", "100g")'}>Serving</FieldLabel>
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
                <FieldLabel hint="(kcal)">Calories</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  value={calories}
                  onChange={(event) => setCalories(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <FieldLabel hint="(g)">Protein</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  value={protein}
                  onChange={(event) => setProtein(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <FieldLabel hint="(g)">Carbs</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  value={carbs}
                  onChange={(event) => setCarbs(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <FieldLabel hint="(g)">Fat</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  value={fat}
                  onChange={(event) => setFat(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>

            <MealSlotSelect value={mealSlot} onChange={setMealSlot} />

            <div>
              <FieldLabel htmlFor="new-food-quantity" hint="(1x = one serving above)">
                Quantity
              </FieldLabel>
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
