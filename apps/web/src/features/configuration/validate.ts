import type { Configuration } from "@/data/schemas/configuration";

// Frontend pre-validates for instant feedback — the Go handler
// (internal/configuration/validate.go) is the authoritative check.
export function validate(input: Configuration): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.nutritionCaloriesTarget <= 0) errors.nutritionCaloriesTarget = "must be positive";
  if (input.nutritionProteinTarget <= 0) errors.nutritionProteinTarget = "must be positive";
  if (input.nutritionCarbsTarget <= 0) errors.nutritionCarbsTarget = "must be positive";
  if (input.nutritionFatTarget <= 0) errors.nutritionFatTarget = "must be positive";

  return errors;
}
