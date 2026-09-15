import { describe, expect, it } from "vitest";

import { selectStreak } from "@/features/habits/select-streak";

function entry(habitId: string, date: string) {
  return { id: `${habitId}-${date}`, habitId, date, createdAt: `${date}T00:00:00Z` };
}

describe("selectStreak", () => {
  it("counts consecutive days including today", () => {
    const entries = [entry("h1", "2026-09-12"), entry("h1", "2026-09-13"), entry("h1", "2026-09-14")];
    expect(selectStreak(entries, "h1", "2026-09-14")).toBe(3);
  });

  it("stops at the first gap", () => {
    const entries = [entry("h1", "2026-09-10"), entry("h1", "2026-09-13"), entry("h1", "2026-09-14")];
    expect(selectStreak(entries, "h1", "2026-09-14")).toBe(2);
  });

  it("is 0 when today itself has no entry, even with a prior streak", () => {
    const entries = [entry("h1", "2026-09-12"), entry("h1", "2026-09-13")];
    expect(selectStreak(entries, "h1", "2026-09-14")).toBe(0);
  });

  it("ignores other habits' entries", () => {
    const entries = [entry("h1", "2026-09-14"), entry("h2", "2026-09-13")];
    expect(selectStreak(entries, "h1", "2026-09-14")).toBe(1);
  });

  it("is 0 for no entries", () => {
    expect(selectStreak([], "h1", "2026-09-14")).toBe(0);
  });
});
