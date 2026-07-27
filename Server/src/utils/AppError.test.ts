import { describe, expect, it } from "vitest";
import { AppError, badRequest, notFound, forbidden, unauthorized, conflict } from "./AppError.js";
import { requireParam } from "./params.js";

describe("AppError factories", () => {
  it("sets the right status codes", () => {
    expect(badRequest("x").status).toBe(400);
    expect(unauthorized().status).toBe(401);
    expect(forbidden().status).toBe(403);
    expect(notFound("Thing").status).toBe(404);
    expect(conflict("x").status).toBe(409);
  });

  it("is an instance of Error", () => {
    expect(new AppError("test", 418)).toBeInstanceOf(Error);
  });
});

describe("requireParam", () => {
  it("returns the value when it's a non-empty string", () => {
    expect(requireParam("abc", "id")).toBe("abc");
  });

  it("throws when the value is undefined (route param missing)", () => {
    expect(() => requireParam(undefined, "id")).toThrow(/id is required/);
  });

  it("throws when the value is a string array (repeated route segment)", () => {
    expect(() => requireParam(["a", "b"], "id")).toThrow();
  });
});
