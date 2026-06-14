import { describe, expect, it } from "vitest";

import { isTimezoneValid } from "./is-timezone-valid";

describe("isTimezoneValid", () => {
  it("accepts UTC", () => {
    expect(isTimezoneValid("UTC")).toBe(true);
  });

  it("accepts Asia/Tokyo", () => {
    expect(isTimezoneValid("Asia/Tokyo")).toBe(true);
  });

  it("accepts America/New_York", () => {
    expect(isTimezoneValid("America/New_York")).toBe(true);
  });

  it("accepts Europe/Moscow", () => {
    expect(isTimezoneValid("Europe/Moscow")).toBe(true);
  });

  it("accepts Asia/Kamchatka", () => {
    expect(isTimezoneValid("Asia/Kamchatka")).toBe(true);
  });

  it("accepts Asia/Vladivostok", () => {
    expect(isTimezoneValid("Asia/Vladivostok")).toBe(true);
  });

  it("rejects Foo/Bar", () => {
    expect(isTimezoneValid("Foo/Bar")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isTimezoneValid("")).toBe(false);
  });
});
