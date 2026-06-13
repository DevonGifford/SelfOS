import { selectDailyCompletion } from "@/features/habits/select-daily-completion";
import { useHabitEntries } from "@/features/habits/use-habit-entries";
import { useHabits } from "@/features/habits/use-habits";

// StatusHeatmap's aggregate is a pure client-side derivation from raw
// habits + entries (decision 09) — not its own API endpoint. Same
// {data, isPending, isError} shape as every other domain hook, so callers
// (use-status.ts) don't need to know this one composes two queries.
export function useHabitsHistory() {
  const habitsQuery = useHabits();
  const entriesQuery = useHabitEntries();

  return {
    data:
      habitsQuery.data && entriesQuery.data
        ? selectDailyCompletion(entriesQuery.data, habitsQuery.data)
        : undefined,
    isPending: habitsQuery.isPending || entriesQuery.isPending,
    isError: habitsQuery.isError || entriesQuery.isError,
  };
}
