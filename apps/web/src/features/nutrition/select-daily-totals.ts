import type { FoodEntries } from "@/data/schemas/food-entries";
import type { Nutrition } from "@/data/schemas/nutrition";

// Nutrition Targets are Configuration (CONTEXT.md), not schema — no
// settings UI exists to justify a real table yet (decision 13). Kept in
// exactly one place client-side; the Go API doesn't return these at all.
export const NUTRITION_TARGETS = {
  calories: 2300,
  protein: 165,
  carbs: 220,
  fat: 70,
};

// The day's totals + meal list are a pure client-side derivation from raw
// FoodEntries (decision 15) — same "API returns raw, client derives" rule
// every other real domain follows. `Nutrition`'s shape is unchanged from
// its old demo-only form; only where the numbers come from changes.
export function selectDailyTotals(entries: FoodEntries, today: string): Nutrition {
  const todays = entries.filter((entry) => entry.date === today);

  function sum(key: "calories" | "protein" | "carbs" | "fat") {
    return todays.reduce((total, entry) => total + entry[key], 0);
  }

  return {
    totals: {
      calories: { consumed: sum("calories"), target: NUTRITION_TARGETS.calories },
      protein: { consumed: sum("protein"), target: NUTRITION_TARGETS.protein },
      carbs: { consumed: sum("carbs"), target: NUTRITION_TARGETS.carbs },
      fat: { consumed: sum("fat"), target: NUTRITION_TARGETS.fat },
    },
    meals: todays.map((entry) => ({
      id: entry.id,
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    })),
  };
}
