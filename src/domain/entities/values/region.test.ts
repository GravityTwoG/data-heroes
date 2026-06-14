import { describe, expect, it } from "vitest";

import { isRegionValid } from "./region";

describe("isRegionValid", () => {
  it("accepts US", () => {
    expect(isRegionValid("US")).toBe(true);
  });

  it("accepts EU", () => {
    expect(isRegionValid("EU")).toBe(true);
  });

  it("accepts DE", () => {
    expect(isRegionValid("DE")).toBe(true);
  });

  it("accepts RU", () => {
    expect(isRegionValid("RU")).toBe(true);
  });

  it("rejects made-up code XX", () => {
    expect(isRegionValid("XX")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isRegionValid("")).toBe(false);
  });

  it("rejects too long input", () => {
    expect(isRegionValid("ABCDE")).toBe(false);
  });
});
