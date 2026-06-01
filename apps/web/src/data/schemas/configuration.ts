import { z } from "zod";

export const ConfigurationSchema = z.object({
  nutritionCaloriesTarget: z.number(),
  nutritionProteinTarget: z.number(),
  nutritionCarbsTarget: z.number(),
  nutritionFatTarget: z.number(),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;
