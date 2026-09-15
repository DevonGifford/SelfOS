import type { HabitEntries } from "@/data/schemas/habit-entries";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Consecutive days with an entry, walking backward from `today`, stopping
// at the first gap — including today itself if it's already completed.
// Pure function operating on plain YYYY-MM-DD date strings throughout, so
// it's UTC-vs-local-safe: `today` is always caller-supplied (todayString()),
// never computed internally.
export function selectStreak(entries: HabitEntries, habitId: string, today: string): number {
  const days = new Set(entries.filter((entry) => entry.habitId === habitId).map((entry) => entry.date));

  let streak = 0;
  let cursor = new Date(`${today}T00:00:00Z`);

  while (days.has(toDateKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }

  return streak;
}
