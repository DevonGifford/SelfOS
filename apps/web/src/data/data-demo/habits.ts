import type { Habits } from "@/data/schemas/habits";

// Dead code once "habits" leaves DEMO_DOMAINS (data/client.ts shadows this
// with the real api-client functions) — kept in the old demo-fallback
// shape rather than deleted, matching measurements' precedent of never
// removing a domain's demo path just because it went real.
export const demoHabits: Habits = [
  { id: "habit-1", name: "Morning walk", active: true, position: 0, createdAt: "2026-08-01T00:00:00Z" },
  { id: "habit-2", name: "Read 20 min", active: true, position: 1, createdAt: "2026-08-01T00:00:00Z" },
  { id: "habit-3", name: "No sugar", active: true, position: 2, createdAt: "2026-08-01T00:00:00Z" },
  { id: "habit-4", name: "Stretch", active: true, position: 3, createdAt: "2026-08-01T00:00:00Z" },
  { id: "habit-5", name: "Journal", active: true, position: 4, createdAt: "2026-08-01T00:00:00Z" },
];
