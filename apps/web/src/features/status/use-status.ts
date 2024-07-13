import { todayString } from "@/lib/date";
import { useHabitEntries } from "@/features/habits/use-habit-entries";
import { useHabits } from "@/features/habits/use-habits";
import { useHabitsHistory } from "@/features/habits/use-habits-history";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";
import { useNutrition } from "@/features/nutrition/use-nutrition";
import { useUnfinishedWorkoutSession, useWorkoutSessions } from "@/features/training/use-workout-sessions";
import type { WorkoutSessions } from "@/data/schemas/workout-sessions";

import { deriveStatus } from "./derive-status";

// The single hook routes/home.tsx calls — same {data, isPending, isError}
// shape as every other domain hook (features/*/use-*.ts), even though this
// one composes several queries internally. This is what makes Status a
// module rather than a route: the orchestration lives here, once, not in
// the page.
export function useStatus() {
  const sessionsQuery = useWorkoutSessions();
  const unfinishedSessionQuery = useUnfinishedWorkoutSession();
  const nutritionQuery = useNutrition();
  const habitsQuery = useHabits();
  const habitEntriesQuery = useHabitEntries();
  const habitsHistoryQuery = useHabitsHistory();
  const measurementsQuery = useMeasurements();

  const queries = [
    sessionsQuery,
    unfinishedSessionQuery,
    nutritionQuery,
    habitsQuery,
    habitEntriesQuery,
    habitsHistoryQuery,
    measurementsQuery,
  ];

  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);

  const data =
    sessionsQuery.data &&
    unfinishedSessionQuery.data !== undefined &&
    nutritionQuery.data &&
    habitsQuery.data &&
    habitEntriesQuery.data &&
    habitsHistoryQuery.data &&
    measurementsQuery.data
      ? {
          status: deriveStatus(
            {
              lastFinishedSession: selectLastFinishedSession(sessionsQuery.data),
              unfinishedSession: unfinishedSessionQuery.data
                ? { id: unfinishedSessionQuery.data.id, workoutType: unfinishedSessionQuery.data.workoutType }
                : null,
            },
            nutritionQuery.data,
            habitsQuery.data,
            habitEntriesQuery.data,
            todayString(),
          ),
          dailyMinimums: selectDailyMinimums(measurementsQuery.data),
          habitsHistory: habitsHistoryQuery.data,
        }
      : undefined;

  return { data, isPending, isError };
}

function selectLastFinishedSession(sessions: WorkoutSessions) {
  const finished = sessions.filter((s) => s.finishedAt !== null);
  if (finished.length === 0) return null;

  const latest = finished.reduce((a, b) => (a.date >= b.date ? a : b));
  return { id: latest.id, workoutType: latest.workoutType, date: latest.date };
}
