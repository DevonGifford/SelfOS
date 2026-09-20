import { useState } from "react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { FoodEntry, MealSlot } from "@/data/schemas/food-entries";
import type { Foods } from "@/data/schemas/foods";
import { MacroAdjustmentFields } from "@/features/nutrition/macro-adjustment-fields";
import { MealSlotSelect } from "@/features/nutrition/meal-slot-select";
import { SaveEntryActions } from "@/features/nutrition/save-entry-actions";
import { useUpdateFoodEntry } from "@/features/nutrition/use-food-entry-mutations";
import { useCreateFood, useUpdateFood } from "@/features/nutrition/use-food-mutations";
import { useMacroAdjustment } from "@/features/nutrition/use-macro-adjustment";
import { validateQuantity } from "@/features/nutrition/validate";

type EntryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FoodEntry;
  foods: Foods;
};

// Quantity + manual per-macro adjustment, then a choice of what the save
// should do — Log this once (just this entry), Update Food (overwrite the
// reusable Food's per-serving rate with today's adjusted amounts), or Save
// as new food (a separate reusable Food, original untouched). "Save as new
// food" deliberately doesn't reassign this entry's foodId — its own
// snapshot values are already correct regardless of which Food it's linked
// to; only future logs would pick up the new Food explicitly. The
// adjustment mechanics (quantity/macro state, the fields, the save card,
// the meal selector) are shared with the Add flow's SelectedFoodAdjustment
// — this component only supplies the edit-specific save semantics.
export function EntryDrawer({ open, onOpenChange, entry, foods }: EntryDrawerProps) {
  const food = foods.find((f) => f.id === entry.foodId);

  // Per-serving rate: the live Food when it still exists, else derived from
  // this entry's own current values (an orphaned entry has no Food to ask).
  const baseRates = food
    ? {
        calories: food.caloriesPerServing,
        protein: food.proteinPerServing,
        carbs: food.carbsPerServing,
        fat: food.fatPerServing,
      }
    : {
        calories: entry.calories / entry.quantity,
        protein: entry.protein / entry.quantity,
        carbs: entry.carbs / entry.quantity,
        fat: entry.fat / entry.quantity,
      };

  const { quantity, nudgeQuantity, nudgeMacro, resolvedMacros } = useMacroAdjustment(baseRates, entry.quantity);
  const [mealSlot, setMealSlot] = useState<MealSlot>(entry.mealSlot);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateEntryMutation = useUpdateFoodEntry();
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
      updateEntryMutation.mutate(
        { id: entry.id, ...resolvedMacros(), mealSlot },
        { onSuccess: () => onOpenChange(false) },
      );
    });
  }

  function updateFoodAndLog() {
    if (!food) return;
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
            updateEntryMutation.mutate(
              { id: entry.id, ...r, mealSlot },
              { onSuccess: () => onOpenChange(false) },
            );
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
          name: entry.name,
          servingLabel: food?.servingLabel ?? "1x",
          caloriesPerServing: r.calories / r.quantity,
          proteinPerServing: r.protein / r.quantity,
          carbsPerServing: r.carbs / r.quantity,
          fatPerServing: r.fat / r.quantity,
        },
        {
          onSuccess: () => {
            updateEntryMutation.mutate(
              { id: entry.id, ...r, mealSlot },
              { onSuccess: () => onOpenChange(false) },
            );
          },
        },
      );
    });
  }

  const isSaving =
    updateEntryMutation.isPending || updateFoodMutation.isPending || createFoodMutation.isPending;
  const macros = resolvedMacros();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{entry.name}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-4">
          <MacroAdjustmentFields
            servingLabel={food?.servingLabel ?? "serving"}
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
            onUpdateFood={food ? updateFoodAndLog : undefined}
            onSaveAsNewFood={saveAsNewFoodAndLog}
            disabled={isSaving}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
