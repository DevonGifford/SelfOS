import type { Weight, WeightEntry } from "@/data/schemas/weight";

// Multiple entries on the same day are allowed (e.g. morning + evening
// weigh-ins), but anywhere a single "current weight" number is shown
// (trend chart, Status ring, the /measurements "Latest" stat) uses that
// day's lowest reading, applied consistently everywhere — never the
// literal last-logged row, which could be a heavier same-day entry.
export function selectDailyMinimums(entries: Weight): Weight {
  const byDate = new Map<string, WeightEntry>();

  for (const entry of entries) {
    const current = byDate.get(entry.date);
    if (!current || entry.kg < current.kg) {
      byDate.set(entry.date, entry);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
