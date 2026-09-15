import { demoHabits } from "@/data/data-demo/habits";
import type { HabitEntries } from "@/data/schemas/habit-entries";

const DAY_COUNT = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Same small deterministic PRNG as habits-history.ts, so the guest's
// checklist for "today" and recent days lines up with a plausible history
// instead of reshuffling on every load.
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHabitEntries(): HabitEntries {
  const random = mulberry32(20260908);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries: HabitEntries = [];
  let id = 0;

  // Skip "today" itself for each habit at a coin-flip so the checklist
  // isn't suspiciously all-complete on first look — leaves a few boxes
  // for the guest to actually tap.
  for (let i = DAY_COUNT - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * MS_PER_DAY);
    const dateStr = date.toISOString().slice(0, 10);

    for (const habit of demoHabits) {
      const completed = i === 0 ? random() < 0.4 : random() < 0.75;
      if (!completed) continue;

      id++;
      entries.push({
        id: `habit-entry-${id}`,
        habitId: habit.id,
        date: dateStr,
        createdAt: date.toISOString(),
      });
    }
  }

  return entries;
}

export const demoHabitEntries: HabitEntries = generateHabitEntries();
