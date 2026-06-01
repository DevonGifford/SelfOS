import type { Configuration } from "@/data/schemas/configuration";

// Maps Configuration's flat wire shape to the {calories, protein, carbs,
// fat} shape selectDailyTotals already expects. Also the natural seam for
// a future selectTrainingSchedule(configuration) sibling.
export function selectNutritionTargets(configuration: Configuration) {
  return {
    calories: configuration.nutritionCaloriesTarget,
    protein: configuration.nutritionProteinTarget,
    carbs: configuration.nutritionCarbsTarget,
    fat: configuration.nutritionFatTarget,
  };
}
