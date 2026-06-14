import { describe, expect, it } from "vitest";

import { NUTRITION_TARGETS, selectDailyTotals } from "@/features/nutrition/select-daily-totals";
import type { FoodEntries } from "@/data/schemas/food-entries";

function entry(overrides: Partial<FoodEntries[number]> = {}): FoodEntries[number] {
  return {
    id: "e1",
    foodId: "f1",
    name: "Oats & berries",
    quantity: 1,
    calories: 420,
    protein: 18,
    carbs: 62,
    fat: 10,
    date: "2026-09-14",
    createdAt: "2026-09-14T08:00:00Z",
    ...overrides,
  };
}

describe("selectDailyTotals", () => {
  it("sums only today's entries", () => {
    const entries = [entry({ id: "e1", date: "2026-09-14" }), entry({ id: "e2", date: "2026-09-13" })];
    const result = selectDailyTotals(entries, "2026-09-14");
    expect(result.totals.calories.consumed).toBe(420);
    expect(result.meals).toHaveLength(1);
  });

  it("pairs consumed with the hardcoded targets", () => {
    const result = selectDailyTotals([entry()], "2026-09-14");
    expect(result.totals.calories.target).toBe(NUTRITION_TARGETS.calories);
    expect(result.totals.protein.target).toBe(NUTRITION_TARGETS.protein);
  });

  it("sums multiple entries for the same day", () => {
    const entries = [
      entry({ id: "e1", calories: 420, protein: 18 }),
      entry({ id: "e2", calories: 240, protein: 30, name: "Protein shake" }),
    ];
    const result = selectDailyTotals(entries, "2026-09-14");
    expect(result.totals.calories.consumed).toBe(660);
    expect(result.totals.protein.consumed).toBe(48);
    expect(result.meals.map((m) => m.name)).toEqual(["Oats & berries", "Protein shake"]);
  });

  it("returns zeroed totals and no meals for no entries today", () => {
    const result = selectDailyTotals([entry({ date: "2026-09-01" })], "2026-09-14");
    expect(result.totals.calories.consumed).toBe(0);
    expect(result.meals).toEqual([]);
  });
});
