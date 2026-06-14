import { describe, it, expect } from "vitest";
import { isTimeValid } from "./is-time-valid";

describe("isTimeValid", () => {
  it("accepts 00:00", () => {
    expect(isTimeValid("00:00")).toBe(true);
  });

  it("accepts 23:59", () => {
    expect(isTimeValid("23:59")).toBe(true);
  });

  it("accepts 12:00", () => {
    expect(isTimeValid("12:00")).toBe(true);
  });

  it("rejects 24:00", () => {
    expect(isTimeValid("24:00")).toBe(false);
  });

  it("rejects 12:60", () => {
    expect(isTimeValid("12:60")).toBe(false);
  });

  it("rejects foo", () => {
    expect(isTimeValid("foo")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isTimeValid("")).toBe(false);
  });
});
