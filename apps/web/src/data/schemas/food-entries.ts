import { z } from "zod";

// Locked set of daily meal slots — chosen over open-ended/dynamic grouping
// for simplicity. An entry logged outside its "natural" window (e.g. an
// early snack) just gets logged under whichever slot the user picks.
export const MEAL_SLOTS = ["breakfast", "snack", "lunch", "tea", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

// A FoodEntry is the Event (CONTEXT.md) — fully snapshots name and the
// already-quantity-multiplied macros at log time, independent of later
// edits to (or deletion of) the Food it came from. `foodId` is nullable:
// null means the originating Food has since been deleted.
export const FoodEntrySchema = z.object({
  id: z.string(),
  foodId: z.string().nullable(),
  name: z.string(),
  quantity: z.number(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  date: z.string(),
  createdAt: z.string(),
  mealSlot: z.enum(MEAL_SLOTS),
});

export const FoodEntriesSchema = z.array(FoodEntrySchema);

export type FoodEntry = z.infer<typeof FoodEntrySchema>;
export type FoodEntries = z.infer<typeof FoodEntriesSchema>;
