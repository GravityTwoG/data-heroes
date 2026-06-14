import { describe, expect, it } from "vitest";

import { isInQuietHours } from "./is-in-quiet-hours";

describe("isInQuietHours", () => {
  it("returns true when current time is within normal range", () => {
    const result = isInQuietHours(new Date("2024-12-15T14:00:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
  });

  it("returns false when current time is before normal range", () => {
    const result = isInQuietHours(new Date("2024-12-15T08:00:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "UTC",
    });

    expect(result).toBe(false);
  });

  it("returns false when current time is after normal range", () => {
    const result = isInQuietHours(new Date("2024-12-15T18:00:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "UTC",
    });

    expect(result).toBe(false);
  });

  it("returns true when current time is within overnight range", () => {
    const result = isInQuietHours(new Date("2024-12-15T23:00:00Z"), {
      start: "22:00",
      end: "06:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
  });

  it("returns true when current time is within overnight range after midnight", () => {
    const result = isInQuietHours(new Date("2024-12-15T03:00:00Z"), {
      start: "22:00",
      end: "06:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
  });

  it("returns false when current time is outside overnight range", () => {
    const result = isInQuietHours(new Date("2024-12-15T14:00:00Z"), {
      start: "22:00",
      end: "06:00",
      timezone: "UTC",
    });

    expect(result).toBe(false);
  });

  it("returns true at exact start boundary", () => {
    const result = isInQuietHours(new Date("2024-12-15T09:00:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
  });

  it("returns true at exact end boundary", () => {
    const result = isInQuietHours(new Date("2024-12-15T17:00:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "UTC",
    });

    expect(result).toBe(true);
  });

  it("converts timezone correctly", () => {
    // 09:00 (UTC+9)
    const result = isInQuietHours(new Date("2024-12-15T00:00:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "Asia/Tokyo",
    });

    expect(result).toBe(true);
  });

  it("converts timezone correctly — before quiet hours in local time", () => {
    // 17:01 (UTC+9)
    const result = isInQuietHours(new Date("2024-12-15T08:01:00Z"), {
      start: "09:00",
      end: "17:00",
      timezone: "Asia/Tokyo",
    });

    expect(result).toBe(false);
  });

  it("handles overnight range across timezone boundary", () => {
    // 00:00 (UTC-5)
    const result = isInQuietHours(new Date("2024-12-15T05:00:00Z"), {
      start: "22:00",
      end: "06:00",
      timezone: "America/New_York",
    });

    expect(result).toBe(true);
  });

  it("handles spring-forward — skipped hour is outside range", () => {
    // 06:59 UTC = 01:59 (UTC-5), within 01:30-02:30
    const inside = isInQuietHours(new Date("2024-03-10T06:59:00Z"), {
      start: "01:30",
      end: "02:30",
      timezone: "America/New_York",
    });
    // 07:00 UTC = 03:00 (UTC-4), outside (02:00-03:00 skipped)
    const outside = isInQuietHours(new Date("2024-03-10T07:00:00Z"), {
      start: "01:30",
      end: "02:30",
      timezone: "America/New_York",
    });

    expect(inside).toBe(true);
    expect(outside).toBe(false);
  });

  it("handles fall-back — repeated hour is inside range on both passes", () => {
    // 05:30 UTC = 01:30 (UTC-4)
    const first = isInQuietHours(new Date("2024-11-03T05:30:00Z"), {
      start: "01:00",
      end: "02:00",
      timezone: "America/New_York",
    });
    // 06:30 UTC = 01:30 (UTC-5)
    const second = isInQuietHours(new Date("2024-11-03T06:30:00Z"), {
      start: "01:00",
      end: "02:00",
      timezone: "America/New_York",
    });

    expect(first).toBe(true);
    expect(second).toBe(true);
  });
});
