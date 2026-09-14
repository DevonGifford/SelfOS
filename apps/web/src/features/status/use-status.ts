import { useHabits } from "@/features/habits/use-habits";
import { useHabitsHistory } from "@/features/habits/use-habits-history";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";
import { useNutrition } from "@/features/nutrition/use-nutrition";
import { selectLastComparableSession } from "@/features/training/select-last-comparable-session";
import { useTraining } from "@/features/training/use-training";
import { useTrainingHistory } from "@/features/training/use-training-history";

import { deriveStatus } from "./derive-status";

// The single hook routes/status.tsx calls — same {data, isPending, isError}
// shape as every other domain hook (features/*/use-*.ts), even though this
// one composes six queries internally. This is what makes Status a module
// rather than a route: the orchestration lives here, once, not in the page.
export function useStatus() {
  const trainingQuery = useTraining();
  const trainingHistoryQuery = useTrainingHistory();
  const nutritionQuery = useNutrition();
  const habitsQuery = useHabits();
  const habitsHistoryQuery = useHabitsHistory();
  const measurementsQuery = useMeasurements();

  const queries = [
    trainingQuery,
    trainingHistoryQuery,
    nutritionQuery,
    habitsQuery,
    habitsHistoryQuery,
    measurementsQuery,
  ];

  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);

  const data =
    trainingQuery.data &&
    trainingHistoryQuery.data &&
    nutritionQuery.data &&
    habitsQuery.data &&
    habitsHistoryQuery.data &&
    measurementsQuery.data
      ? {
          status: deriveStatus(trainingQuery.data, nutritionQuery.data, habitsQuery.data),
          dailyMinimums: selectDailyMinimums(measurementsQuery.data),
          lastSession: selectLastComparableSession(
            trainingHistoryQuery.data,
            trainingQuery.data.type,
          ),
          habitsHistory: habitsHistoryQuery.data,
        }
      : undefined;

  return { data, isPending, isError };
}
