import type { Habits } from "@/data/schemas/habits";
import type { Nutrition } from "@/data/schemas/nutrition";
import type { Status } from "@/data/schemas/status";
import type { Training } from "@/data/schemas/training";

// Status is a read model (CONTEXT.md), never its own source of truth —
// this composes already-fetched domain data rather than fetching anything
// itself, so it stays correct as each domain migrates to real data one at
// a time instead of silently keeping a stale aggregate for whichever
// domain hasn't gone real yet.
export function deriveStatus(training: Training, nutrition: Nutrition, habits: Habits): Status {
  return {
    training: {
      type: training.type,
      focus: training.split,
      tomorrow: training.tomorrow,
    },
    nutrition: {
      calories: nutrition.totals.calories,
      protein: nutrition.totals.protein,
      carbs: nutrition.totals.carbs,
      fat: nutrition.totals.fat,
    },
    habits: {
      completed: habits.filter((habit) => habit.completedToday).length,
      total: habits.length,
    },
  };
}
