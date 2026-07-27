import { describe, expect, it } from "vitest";
import { formatPrice, discountPercent } from "./currency";

describe("formatPrice", () => {
  it("formats GHS with the cedi symbol and 2 decimals", () => {
    expect(formatPrice(45, "GHS")).toBe("GH\u20B545.00");
  });

  it("defaults to GHS when no currency is given", () => {
    expect(formatPrice(10)).toBe("GH\u20B510.00");
  });

  it("formats IDR without decimals", () => {
    expect(formatPrice(150000, "IDR")).toBe("Rp150,000");
  });

  it("falls back to the raw currency code for an unmapped currency", () => {
    expect(formatPrice(20, "EUR")).toBe("EUR 20.00");
  });
});

describe("discountPercent", () => {
  it("returns null when there's no original price", () => {
    expect(discountPercent(50, null)).toBeNull();
    expect(discountPercent(50, undefined)).toBeNull();
  });

  it("returns null when the original price isn't actually higher", () => {
    expect(discountPercent(50, 50)).toBeNull();
    expect(discountPercent(50, 40)).toBeNull();
  });

  it("computes a rounded percentage off", () => {
    expect(discountPercent(75, 100)).toBe(25);
    expect(discountPercent(33, 100)).toBe(67);
  });
});
