import type { Habits } from "@/data/schemas/habits";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

// No longer purely dead code now that guest-client.ts seeds its in-memory
// store from this fixture too — still unreachable for a real logged-in
// user since "habits" left DEMO_DOMAINS (data/client.ts shadows this with
// the real api-client functions there), but guest sessions route back to
// it regardless of migration status.
export const demoHabits: Habits = [
  { id: "habit-1", name: "Morning walk", active: true, position: 0, createdAt: daysAgo(45) },
  { id: "habit-2", name: "Read 20 min", active: true, position: 1, createdAt: daysAgo(45) },
  { id: "habit-3", name: "No sugar", active: true, position: 2, createdAt: daysAgo(45) },
  { id: "habit-4", name: "Stretch", active: true, position: 3, createdAt: daysAgo(45) },
  { id: "habit-5", name: "Journal", active: true, position: 4, createdAt: daysAgo(45) },
];
