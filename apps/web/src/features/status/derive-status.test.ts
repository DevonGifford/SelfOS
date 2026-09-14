import { describe, expect, it } from "vitest";

import { deriveStatus } from "@/features/status/derive-status";
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
  { id: "h1", name: "Walk", streak: 3, completedToday: true },
  { id: "h2", name: "Read", streak: 1, completedToday: false },
];

describe("deriveStatus", () => {
  it("carries training's type/split/tomorrow through as focus/tomorrow", () => {
    const status = deriveStatus(training, nutrition, habits);
    expect(status.training).toEqual({ type: "push", focus: "Push", tomorrow: "Pull" });
  });

  it("passes nutrition totals through unchanged", () => {
    const status = deriveStatus(training, nutrition, habits);
    expect(status.nutrition.calories).toEqual({ consumed: 1800, target: 2200 });
  });

  it("counts completed vs total habits", () => {
    const status = deriveStatus(training, nutrition, habits);
    expect(status.habits).toEqual({ completed: 1, total: 2 });
  });

  it("handles no habits at all", () => {
    const status = deriveStatus(training, nutrition, []);
    expect(status.habits).toEqual({ completed: 0, total: 0 });
  });
});
