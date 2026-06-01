import type { FoodEntries } from "@/data/schemas/food-entries";
import type { Nutrition } from "@/data/schemas/nutrition";

type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// The day's totals + meal list are a pure client-side derivation from raw
// FoodEntries (decision 15) — same "API returns raw, client derives" rule
// every other real domain follows. `Nutrition`'s shape is unchanged from
// its old demo-only form; only where the numbers come from changes.
// Targets now come from the real Configuration domain (select-nutrition-
// targets.ts) rather than a hardcoded constant — this selector no longer
// knows or cares where they came from.
export function selectDailyTotals(
  entries: FoodEntries,
  today: string,
  targets: NutritionTargets,
): Nutrition {
  const todays = entries.filter((entry) => entry.date === today);

  function sum(key: "calories" | "protein" | "carbs" | "fat") {
    return todays.reduce((total, entry) => total + entry[key], 0);
  }

  return {
    totals: {
      calories: { consumed: sum("calories"), target: targets.calories },
      protein: { consumed: sum("protein"), target: targets.protein },
      carbs: { consumed: sum("carbs"), target: targets.carbs },
      fat: { consumed: sum("fat"), target: targets.fat },
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
