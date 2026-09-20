import type { Weight, WeightEntry } from "@/data/schemas/weight";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_COUNT = 400; // ~13 months back, far enough to cross a year boundary for month-nav testing

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString().slice(0, 10);
}

// Same small deterministic PRNG as habit-entries.ts/habits-history.ts (own
// seed so the two datasets don't correlate), so the guest's weight history
// is a stable-looking gradual trend instead of reshuffling on every load.
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

function generateWeight(): Weight {
  const random = mulberry32(20250815);
  const entries: WeightEntry[] = [];
  let kg = 88.6;
  let id = 0;

  for (let day = DAY_COUNT; day >= 0; day--) {
    // Small daily drift, gently pulled back toward the middle of the
    // 87-90kg band so the walk stays believable instead of wandering off.
    const pull = (88.5 - kg) * 0.08;
    kg = Math.round((kg + pull + (random() - 0.5) * 0.3) * 10) / 10;
    kg = Math.min(90, Math.max(87, kg));

    const date = daysAgo(day);
    id++;
    entries.push({ id: `weight-${id}`, date, kg });

    // Roughly one day in twelve gets a same-day second reading (e.g. an
    // evening re-weigh), so month-nav testing has real multi-entry days
    // to expand.
    if (random() < 1 / 12) {
      const extraKg = Math.min(90, Math.max(87, Math.round((kg + (random() - 0.5) * 0.6) * 10) / 10));
      id++;
      entries.push({ id: `weight-${id}`, date, kg: extraKg });
    }
  }

  return entries;
}

export const demoWeight: Weight = generateWeight();
