import { describe, expect, it } from "vitest";

import { selectLastComparableSession } from "@/features/training/select-last-comparable-session";
import type { StrengthSession, TrainingHistory } from "@/data/schemas/training-history";

// A minimal, valid strength session — only date and routine usually vary
// between test cases, so everything else gets a sensible default.
function strengthSession(overrides: Partial<StrengthSession>): StrengthSession {
  return {
    id: "s1",
    date: "2026-01-01",
    durationMinutes: 45,
    type: "strength",
    routine: "push",
    workingSetsCompleted: 12,
    workingSetsPlanned: 12,
    setsDelta: 0,
    repsCompleted: 96,
    repsPlanned: 96,
    repsDelta: 0,
    durationDeltaMinutes: 0,
    volumeKg: 2400,
    volumeDeltaPercent: 0,
    personalRecords: 0,
    ...overrides,
  };
}

const history: TrainingHistory = [
  strengthSession({ id: "old-push", date: "2026-01-01", routine: "push" }),
  strengthSession({ id: "new-push", date: "2026-01-08", routine: "push" }),
  strengthSession({ id: "pull", date: "2026-01-05", routine: "pull" }),
];

describe("selectLastComparableSession", () => {
  it("finds the most recent session with the same routine", () => {
    const result = selectLastComparableSession(history, "push");
    expect(result?.id).toBe("new-push");
  });

  it("returns undefined when there's no matching routine yet", () => {
    const result = selectLastComparableSession(history, "legs");
    expect(result).toBeUndefined();
  });

  it("on a rest day, returns the most recent session of any kind", () => {
    const result = selectLastComparableSession(history, "rest");
    expect(result?.id).toBe("new-push");
  });
});
