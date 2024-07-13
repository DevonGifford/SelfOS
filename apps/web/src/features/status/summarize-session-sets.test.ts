import { describe, expect, it } from "vitest";

import { summarizeSessionSets } from "@/features/status/summarize-session-sets";
import type { WorkoutSet } from "@/data/schemas/workout-sets";

function set(overrides: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: "set-1",
    sessionExerciseId: "se-1",
    setType: "working",
    confirmed: true,
    note: null,
    weightKg: null,
    reps: null,
    durationSec: null,
    distanceM: null,
    createdAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("summarizeSessionSets", () => {
  it("sums volume and counts strength sets", () => {
    const result = summarizeSessionSets([
      set({ weightKg: 60, reps: 10 }),
      set({ weightKg: 65, reps: 8 }),
    ]);

    expect(result.strengthSetsCount).toBe(2);
    expect(result.volumeKg).toBe(60 * 10 + 65 * 8);
    expect(result.cardioSetsCount).toBe(0);
  });

  it("sums duration and distance for cardio sets", () => {
    const result = summarizeSessionSets([
      set({ durationSec: 1500, distanceM: 5000 }),
      set({ durationSec: 900, distanceM: 2000 }),
    ]);

    expect(result.cardioSetsCount).toBe(2);
    expect(result.durationSec).toBe(2400);
    expect(result.distanceM).toBe(7000);
    expect(result.strengthSetsCount).toBe(0);
  });

  it("ignores unconfirmed sets", () => {
    const result = summarizeSessionSets([set({ weightKg: 60, reps: 10, confirmed: false })]);

    expect(result.strengthSetsCount).toBe(0);
    expect(result.volumeKg).toBe(0);
  });

  it("tracks strength and cardio separately for a mixed (Freestyle) session", () => {
    const result = summarizeSessionSets([
      set({ weightKg: 20, reps: 12 }),
      set({ durationSec: 600, distanceM: 1000 }),
    ]);

    expect(result.strengthSetsCount).toBe(1);
    expect(result.volumeKg).toBe(240);
    expect(result.cardioSetsCount).toBe(1);
    expect(result.durationSec).toBe(600);
    expect(result.distanceM).toBe(1000);
  });

  it("returns all zeros for no sets", () => {
    expect(summarizeSessionSets([])).toEqual({
      strengthSetsCount: 0,
      volumeKg: 0,
      cardioSetsCount: 0,
      durationSec: 0,
      distanceM: 0,
    });
  });
});
