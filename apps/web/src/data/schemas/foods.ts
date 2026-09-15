import { z } from "zod";

// A Food is the Definition (CONTEXT.md) — name, serving label, and
// calories/macros per serving. Foods can be hard-deleted (unlike Habits)
// since FoodEntry fully snapshots what it needs independent of this row.
export const FoodSchema = z.object({
  id: z.string(),
  name: z.string(),
  servingLabel: z.string(),
  caloriesPerServing: z.number(),
  proteinPerServing: z.number(),
  carbsPerServing: z.number(),
  fatPerServing: z.number(),
  createdAt: z.string(),
});

export const FoodsSchema = z.array(FoodSchema);

export type Food = z.infer<typeof FoodSchema>;
export type Foods = z.infer<typeof FoodsSchema>;
