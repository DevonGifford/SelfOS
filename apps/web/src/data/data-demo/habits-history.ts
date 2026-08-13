import type { HabitsHistory } from "@/data/schemas/habits-history";

const HABIT_COUNT = 5;
const DAY_COUNT = 154; // 22 weeks — fills the heatmap's available width at CELL_SIZE=12/CELL_GAP=4
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Small deterministic PRNG (mulberry32) so the demo heatmap looks the same
// on every load instead of reshuffling on each refresh.
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

function generateHabitsHistory(): HabitsHistory {
  const random = mulberry32(20260908);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries: HabitsHistory = [];
  let streakBias = 0.8;

  for (let i = DAY_COUNT - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * MS_PER_DAY);

    // Occasionally dip into a low-completion patch, then recover — reads
    // like real usage instead of uniform noise.
    if (random() < 0.08) {
      streakBias = streakBias > 0.5 ? 0.3 : 0.85;
    }

    let completed = 0;
    for (let h = 0; h < HABIT_COUNT; h++) {
      if (random() < streakBias) completed++;
    }

    entries.push({
      date: date.toISOString().slice(0, 10),
      completed,
      total: HABIT_COUNT,
    });
  }

  return entries;
}

export const demoHabitsHistory: HabitsHistory = generateHabitsHistory();
