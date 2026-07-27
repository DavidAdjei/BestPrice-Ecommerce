import { describe, expect, it } from "vitest";
import { convertToGHS } from "./fx.js";

describe("convertToGHS", () => {
  it("returns the same amount for GHS", () => {
    expect(convertToGHS(100, "GHS")).toBe(100);
  });

  it("treats a missing/null currency as GHS", () => {
    expect(convertToGHS(50, null)).toBe(50);
    expect(convertToGHS(50, undefined)).toBe(50);
  });

  it("converts a non-GHS currency using its rate", () => {
    const result = convertToGHS(10, "USD");
    expect(result).toBeGreaterThan(10); // USD rate is > 1 GHS
  });

  it("falls back to a 1:1 rate for an unrecognized currency code", () => {
    expect(convertToGHS(75, "ZZZ")).toBe(75);
  });
});
