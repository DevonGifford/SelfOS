import type { HabitEntries } from "@/data/schemas/habit-entries";
import type { Habits } from "@/data/schemas/habits";

// A HabitEntry's existence *is* the completion (schemas/habit-entries.ts)
// — no "completed" boolean to check, just whether a row exists for this
// habit today.
export function isCompletedToday(entries: HabitEntries, habitId: string, today: string): boolean {
  return entries.some((entry) => entry.habitId === habitId && entry.date === today);
}

// Status["habits"]'s {completed, total} — total counts only active
// habits, matching the daily checklist's own definition of "today's
// habits" (inactive ones aren't part of it).
export function selectActiveCompletionCount(
  habits: Habits,
  entries: HabitEntries,
  today: string,
): { completed: number; total: number } {
  const active = habits.filter((habit) => habit.active);
  const completed = active.filter((habit) => isCompletedToday(entries, habit.id, today)).length;
  return { completed, total: active.length };
}
