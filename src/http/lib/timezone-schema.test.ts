import { describe, it, expect } from "vitest";
import { TimezoneSchema } from "./timezone-schema";

describe("TimezoneSchema", () => {
  it("accepts UTC", () => {
    expect(TimezoneSchema.parse("UTC")).toBe("UTC");
  });

  it("accepts Asia/Tokyo", () => {
    expect(TimezoneSchema.parse("Asia/Tokyo")).toBe("Asia/Tokyo");
  });

  it("accepts America/New_York", () => {
    expect(TimezoneSchema.parse("America/New_York")).toBe("America/New_York");
  });

  it("accepts Europe/Moscow", () => {
    expect(TimezoneSchema.parse("Europe/Moscow")).toBe("Europe/Moscow");
  });

  it("accepts Asia/Kamchatka", () => {
    expect(TimezoneSchema.parse("Asia/Kamchatka")).toBe("Asia/Kamchatka");
  });

  it("accepts Asia/Vladivostok", () => {
    expect(TimezoneSchema.parse("Asia/Vladivostok")).toBe("Asia/Vladivostok");
  });

  it("rejects Foo/Bar", () => {
    expect(() => TimezoneSchema.parse("Foo/Bar")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => TimezoneSchema.parse("")).toThrow();
  });
});
