import { useConfiguration } from "@/features/configuration/use-configuration";
import { selectNutritionTargets } from "@/features/configuration/select-nutrition-targets";
import { selectDailyTotals } from "@/features/nutrition/select-daily-totals";
import { useFoodEntries } from "@/features/nutrition/use-food-entries";
import { todayString } from "@/lib/date";

// Same {data, isPending, isError} shape as every other domain hook, even
// though the day's totals are now a client-side derivation from raw
// FoodEntries rather than a direct fetch (mirrors use-habits-history.ts's
// same move for the heatmap aggregate). Now also composes Configuration
// for the real Nutrition Targets, same pattern use-status.ts uses to
// combine multiple queries into one hook.
export function useNutrition() {
  const entriesQuery = useFoodEntries();
  const configQuery = useConfiguration();

  const isPending = entriesQuery.isPending || configQuery.isPending;
  const isError = entriesQuery.isError || configQuery.isError;

  return {
    data:
      entriesQuery.data && configQuery.data
        ? selectDailyTotals(entriesQuery.data, todayString(), selectNutritionTargets(configQuery.data))
        : undefined,
    isPending,
    isError,
  };
}
