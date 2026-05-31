import type { Weight } from "@/data/schemas/weight";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString().slice(0, 10);
}

// Relative to today rather than hardcoded literals — this is the guest's
// actual landing experience (and Training's), not just an inert fallback,
// so stale-looking dates would be immediately visible.
export const demoWeight: Weight = [
  { id: "weight-1", date: daysAgo(6), kg: 82.4 },
  { id: "weight-2", date: daysAgo(5), kg: 82.1 },
  { id: "weight-3", date: daysAgo(4), kg: 82.3 },
  { id: "weight-4", date: daysAgo(3), kg: 81.9 },
  { id: "weight-5", date: daysAgo(2), kg: 81.8 },
  { id: "weight-6", date: daysAgo(1), kg: 81.6 },
  { id: "weight-7", date: daysAgo(0), kg: 81.5 },
];
