import { selectDailyTotals } from "@/features/nutrition/select-daily-totals";
import { useFoodEntries } from "@/features/nutrition/use-food-entries";
import { todayString } from "@/lib/date";

// Same {data, isPending, isError} shape as every other domain hook, even
// though the day's totals are now a client-side derivation from raw
// FoodEntries rather than a direct fetch (mirrors use-habits-history.ts's
// same move for the heatmap aggregate).
export function useNutrition() {
  const entriesQuery = useFoodEntries();

  return {
    data: entriesQuery.data ? selectDailyTotals(entriesQuery.data, todayString()) : undefined,
    isPending: entriesQuery.isPending,
    isError: entriesQuery.isError,
  };
}
