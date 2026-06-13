import { z } from "zod";

// A Habit is the Definition (CONTEXT.md) — name, active status, manual
// sort position. Completion state lives entirely in HabitEntry (the
// Event, schemas/habit-entries.ts); it is never a field here.
export const HabitSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  position: z.number(),
  createdAt: z.string(),
});

export const HabitsSchema = z.array(HabitSchema);

export type Habit = z.infer<typeof HabitSchema>;
export type Habits = z.infer<typeof HabitsSchema>;
