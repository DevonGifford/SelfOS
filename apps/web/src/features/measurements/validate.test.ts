import { describe, expect, it } from "vitest";

import { validate } from "@/features/measurements/validate";

const TODAY = "2026-06-15";

describe("validate", () => {
  it("passes for a valid date and weight", () => {
    expect(validate("2026-06-01", "82.4", TODAY)).toEqual({});
  });

  it("rejects an empty weight", () => {
    expect(validate("2026-06-01", "", TODAY)).toHaveProperty("kg");
  });

  it("rejects a zero or negative weight", () => {
    expect(validate("2026-06-01", "0", TODAY)).toHaveProperty("kg");
    expect(validate("2026-06-01", "-5", TODAY)).toHaveProperty("kg");
  });

  it("rejects a non-numeric weight", () => {
    expect(validate("2026-06-01", "abc", TODAY)).toHaveProperty("kg");
  });

  it("rejects an empty date", () => {
    expect(validate("", "80", TODAY)).toHaveProperty("date");
  });

  it("rejects a future date", () => {
    expect(validate("2026-06-16", "80", TODAY)).toHaveProperty("date");
  });

  it("allows today's date", () => {
    expect(validate(TODAY, "80", TODAY)).toEqual({});
  });
});
