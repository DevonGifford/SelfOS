import { z } from "zod";

export const MealSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const MacroTotalSchema = z.object({
  consumed: z.number(),
  target: z.number(),
});

export const NutritionSchema = z.object({
  totals: z.object({
    calories: MacroTotalSchema,
    protein: MacroTotalSchema,
    carbs: MacroTotalSchema,
    fat: MacroTotalSchema,
  }),
  meals: z.array(MealSchema),
});

export type Meal = z.infer<typeof MealSchema>;
export type Nutrition = z.infer<typeof NutritionSchema>;
