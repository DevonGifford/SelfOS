import type { HabitEntries } from "@/data/schemas/habit-entries";
import type { Habits } from "@/data/schemas/habits";
import type { HabitsHistory } from "@/data/schemas/habits-history";

// StatusHeatmap's {date, completed, total} per day, across all habits —
// a pure client-side derivation (decision 09), not a server endpoint.
// `total` has no true historical record (active/inactive status isn't
// versioned), so it approximates "how many habits existed to be tracked
// that day" via createdAt — simplest thing that works with the data
// actually available.
export function selectDailyCompletion(entries: HabitEntries, habits: Habits): HabitsHistory {
  const completedByDate = new Map<string, Set<string>>();
  for (const entry of entries) {
    const set = completedByDate.get(entry.date) ?? new Set<string>();
    set.add(entry.habitId);
    completedByDate.set(entry.date, set);
  }

  const dates = new Set(entries.map((entry) => entry.date));

  return [...dates]
    .sort()
    .map((date) => {
      const total = habits.filter((habit) => habit.createdAt.slice(0, 10) <= date).length;
      return {
        date,
        completed: completedByDate.get(date)?.size ?? 0,
        total,
      };
    });
}
