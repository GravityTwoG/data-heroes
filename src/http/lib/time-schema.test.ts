import { describe, it, expect } from "vitest";
import { TimeStringSchema } from "./time-schema";

describe("TimeStringSchema", () => {
  it("accepts 00:00", () => {
    expect(TimeStringSchema.parse("00:00")).toBe("00:00");
  });

  it("accepts 23:59", () => {
    expect(TimeStringSchema.parse("23:59")).toBe("23:59");
  });

  it("accepts 12:00", () => {
    expect(TimeStringSchema.parse("12:00")).toBe("12:00");
  });

  it("rejects 24:00", () => {
    expect(() => TimeStringSchema.parse("24:00")).toThrow();
  });

  it("rejects 12:60", () => {
    expect(() => TimeStringSchema.parse("12:60")).toThrow();
  });

  it("rejects foo", () => {
    expect(() => TimeStringSchema.parse("foo")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => TimeStringSchema.parse("")).toThrow();
  });
});
