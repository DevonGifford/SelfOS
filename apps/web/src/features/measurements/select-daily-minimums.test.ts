import { describe, expect, it } from "vitest";

import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";

describe("selectDailyMinimums", () => {
  it("picks the lowest reading per day", () => {
    const result = selectDailyMinimums([
      { id: "1", date: "2026-01-01", kg: 82.4 },
      { id: "2", date: "2026-01-01", kg: 81.9 },
    ]);

    expect(result).toEqual([{ id: "2", date: "2026-01-01", kg: 81.9 }]);
  });

  it("keeps one entry per day when there's only one reading", () => {
    const result = selectDailyMinimums([
      { id: "1", date: "2026-01-01", kg: 82 },
      { id: "2", date: "2026-01-02", kg: 81 },
    ]);

    expect(result).toHaveLength(2);
  });

  it("sorts the result oldest to newest", () => {
    const result = selectDailyMinimums([
      { id: "1", date: "2026-01-02", kg: 81 },
      { id: "2", date: "2026-01-01", kg: 82 },
    ]);

    expect(result.map((entry) => entry.date)).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("returns an empty list for no entries", () => {
    expect(selectDailyMinimums([])).toEqual([]);
  });
});
