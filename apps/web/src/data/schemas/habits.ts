import { z } from "zod";

export const HabitSchema = z.object({
  id: z.string(),
  name: z.string(),
  streak: z.number(),
  completedToday: z.boolean(),
});

export const HabitsSchema = z.array(HabitSchema);

export type Habit = z.infer<typeof HabitSchema>;
export type Habits = z.infer<typeof HabitsSchema>;
