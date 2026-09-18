import { selectActiveCompletionCount } from "@/features/habits/select-completed-today";
import type { HabitEntries } from "@/data/schemas/habit-entries";
import type { Habits } from "@/data/schemas/habits";
import type { Nutrition } from "@/data/schemas/nutrition";
import type { Status } from "@/data/schemas/status";
import type { SessionWorkoutType } from "@/data/schemas/training-shared";

type TrainingStatus = {
  lastFinishedSession: { id: string; workoutType: SessionWorkoutType; date: string } | null;
  unfinishedSession: { id: string; workoutType: SessionWorkoutType } | null;
};

// Status is a read model (CONTEXT.md), never its own source of truth —
// this composes already-fetched domain data rather than fetching anything
// itself, so it stays correct as each domain migrates to real data one at
// a time instead of silently keeping a stale aggregate for whichever
// domain hasn't gone real yet.
export function deriveStatus(
  training: TrainingStatus,
  nutrition: Nutrition,
  habits: Habits,
  habitEntries: HabitEntries,
  today: string,
): Status {
  return {
    training,
    nutrition: {
      calories: nutrition.totals.calories,
      protein: nutrition.totals.protein,
      carbs: nutrition.totals.carbs,
      fat: nutrition.totals.fat,
    },
    habits: selectActiveCompletionCount(habits, habitEntries, today),
  };
}
