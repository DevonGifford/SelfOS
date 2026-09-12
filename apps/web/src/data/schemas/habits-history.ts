import { z } from "zod";

export const HabitHistoryEntrySchema = z.object({
  date: z.string(),
  completed: z.number(),
  total: z.number(),
});

export const HabitsHistorySchema = z.array(HabitHistoryEntrySchema);

export type HabitHistoryEntry = z.infer<typeof HabitHistoryEntrySchema>;
export type HabitsHistory = z.infer<typeof HabitsHistorySchema>;
