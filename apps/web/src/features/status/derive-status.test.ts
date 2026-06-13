import { describe, expect, it } from "vitest";

import { deriveStatus } from "@/features/status/derive-status";
import type { HabitEntries } from "@/data/schemas/habit-entries";
import type { Habits } from "@/data/schemas/habits";
import type { Nutrition } from "@/data/schemas/nutrition";
import type { Training } from "@/data/schemas/training";

const training: Training = {
  type: "push",
  split: "Push",
  tomorrow: "Pull",
  exercises: [],
};

const nutrition: Nutrition = {
  totals: {
    calories: { consumed: 1800, target: 2200 },
    protein: { consumed: 130, target: 160 },
    carbs: { consumed: 190, target: 220 },
    fat: { consumed: 50, target: 70 },
  },
  meals: [],
};

const habits: Habits = [
  { id: "h1", name: "Walk", active: true, position: 0, createdAt: "2026-08-01T00:00:00Z" },
  { id: "h2", name: "Read", active: true, position: 1, createdAt: "2026-08-01T00:00:00Z" },
];

const today = "2026-09-14";

const entries: HabitEntries = [
  { id: "e1", habitId: "h1", date: today, createdAt: `${today}T00:00:00Z` },
];

describe("deriveStatus", () => {
  it("carries training's type/split/tomorrow through as focus/tomorrow", () => {
    const status = deriveStatus(training, nutrition, habits, entries, today);
    expect(status.training).toEqual({ type: "push", focus: "Push", tomorrow: "Pull" });
  });

  it("passes nutrition totals through unchanged", () => {
    const status = deriveStatus(training, nutrition, habits, entries, today);
    expect(status.nutrition.calories).toEqual({ consumed: 1800, target: 2200 });
  });

  it("counts completed vs total active habits for today", () => {
    const status = deriveStatus(training, nutrition, habits, entries, today);
    expect(status.habits).toEqual({ completed: 1, total: 2 });
  });

  it("excludes inactive habits from total", () => {
    const withInactive: Habits = [
      ...habits,
      { id: "h3", name: "Journal", active: false, position: 2, createdAt: "2026-08-01T00:00:00Z" },
    ];
    const status = deriveStatus(training, nutrition, withInactive, entries, today);
    expect(status.habits).toEqual({ completed: 1, total: 2 });
  });

  it("handles no habits at all", () => {
    const status = deriveStatus(training, nutrition, [], [], today);
    expect(status.habits).toEqual({ completed: 0, total: 0 });
  });
});
