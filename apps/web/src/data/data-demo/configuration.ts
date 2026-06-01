import type { Configuration } from "@/data/schemas/configuration";

// Today's exact former hardcoded NUTRITION_TARGETS values — used only to
// seed guest mode, so a guest's default experience is unchanged.
export const demoConfiguration: Configuration = {
  nutritionCaloriesTarget: 2300,
  nutritionProteinTarget: 165,
  nutritionCarbsTarget: 220,
  nutritionFatTarget: 70,
};
