import { z } from "zod";

// A HabitEntry is the Event (CONTEXT.md) — a row's existence *is* the
// completion. There is no "completed" boolean: no row for a given
// habitId+date means not completed that day.
export const HabitEntrySchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

export const HabitEntriesSchema = z.array(HabitEntrySchema);

export type HabitEntry = z.infer<typeof HabitEntrySchema>;
export type HabitEntries = z.infer<typeof HabitEntriesSchema>;
