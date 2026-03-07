import { MEAL_SLOTS, type FoodEntries, type MealSlot } from "@/data/schemas/food-entries";

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  snack: "Snack",
  lunch: "Lunch",
  tea: "Tea",
  dinner: "Dinner",
};

export type MealGroup = { slot: MealSlot; label: string; items: FoodEntries };

// Five fixed slots, always in this order — only the ones with at least one
// entry today render. No dynamic/arbitrary grouping (see the Nutrition
// refactor's exploration phase): simplicity over an open-ended model.
export function selectMealGroups(entries: FoodEntries): MealGroup[] {
  return MEAL_SLOTS.map((slot) => ({
    slot,
    label: MEAL_SLOT_LABELS[slot],
    items: entries.filter((entry) => entry.mealSlot === slot),
  })).filter((group) => group.items.length > 0);
}
