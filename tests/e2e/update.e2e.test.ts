import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyApp } from "@/http/types";

import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { createTestApp, seedDefaultPreferences, truncateAll } from "./helpers";
import { UserPreference } from "@/domain/entities/user-preferences";

describe.sequential("POST /api/v1/users/:id/preferences", () => {
  let app: FastifyApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const userId = "018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e7f";

  const getPreferences = () =>
    app.inject({ method: "GET", url: `/api/v1/users/${userId}/preferences` });

  const updatePreferences = (body: object) =>
    app.inject({ method: "POST", url: `/api/v1/users/${userId}/preferences`, body });

  it("updates a single preference", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    const res = await updatePreferences({
      preference: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      },
    });

    expect(res.statusCode).toBe(200);

    const body = (await getPreferences()).json();
    const pref = body.channels.find(
      (c: UserPreference) =>
        c.type === NotificationType.MARKETING &&
        c.channel === NotificationChannel.EMAIL,
    );
    expect(pref.enabled).toBe(false);
  });

  it("upserts quiet hours", async () => {
    await truncateAll();

    const res = await updatePreferences({
      quietHours: { start: "22:00", end: "08:00", timezone: "Europe/Moscow" },
    });

    expect(res.statusCode).toBe(200);

    const body = (await getPreferences()).json();
    expect(body.quietHours).toEqual({
      start: "22:00",
      end: "08:00",
      timezone: "Europe/Moscow",
    });
  });

  it("removes quiet hours when null", async () => {
    await truncateAll();

    await updatePreferences({
      quietHours: { start: "22:00", end: "08:00", timezone: "Europe/Moscow" },
    });

    const res = await updatePreferences({ quietHours: null });

    expect(res.statusCode).toBe(200);

    const body = (await getPreferences()).json();
    expect(body.quietHours).toBeNull();
  });

  it("updates both preference and quiet hours simultaneously", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    const res = await updatePreferences({
      preference: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      },
      quietHours: {
        start: "23:00",
        end: "07:00",
        timezone: "America/New_York",
      },
    });

    expect(res.statusCode).toBe(200);

    const body = (await getPreferences()).json();
    const pref = body.channels.find(
      (c: any) =>
        c.type === NotificationType.MARKETING &&
        c.channel === NotificationChannel.EMAIL,
    );
    expect(pref.enabled).toBe(false);
    expect(body.quietHours).toEqual({
      start: "23:00",
      end: "07:00",
      timezone: "America/New_York",
    });
  });

  it("updating one preference does not affect other user preferences", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      { type: NotificationType.MARKETING, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.MARKETING, channel: NotificationChannel.SMS, enabled: true },
      { type: NotificationType.TRANSACTION, channel: NotificationChannel.EMAIL, enabled: true },
    ]);

    // user sets all three
    await updatePreferences({ preference: { type: NotificationType.MARKETING, channel: NotificationChannel.EMAIL, enabled: false } });
    await updatePreferences({ preference: { type: NotificationType.MARKETING, channel: NotificationChannel.SMS, enabled: false } });
    await updatePreferences({ preference: { type: NotificationType.TRANSACTION, channel: NotificationChannel.EMAIL, enabled: false } });

    // now change only MARKETING/SMS back to enabled
    const res = await updatePreferences({
      preference: { type: NotificationType.MARKETING, channel: NotificationChannel.SMS, enabled: true },
    });
    expect(res.statusCode).toBe(200);

    const body = (await getPreferences()).json();
    expect(body.channels).toEqual([
      { type: NotificationType.MARKETING, channel: NotificationChannel.EMAIL, enabled: false },
      { type: NotificationType.MARKETING, channel: NotificationChannel.SMS, enabled: true },
      { type: NotificationType.TRANSACTION, channel: NotificationChannel.EMAIL, enabled: false },
    ]);
  });

  it("is idempotent — applying the same preference twice yields the same result", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    const body = {
      preference: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      },
    };

    await updatePreferences(body);
    const afterFirst = (await getPreferences()).json();

    await updatePreferences(body);
    const afterSecond = (await getPreferences()).json();

    expect(afterSecond).toEqual(afterFirst);
  });

  it("rejects non-uuid user id", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/not-a-uuid/preferences`,
      body: { quietHours: { start: "22:00", end: "08:00", timezone: "UTC" } },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects uuid v4 user id", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/550e8400-e29b-41d4-a716-446655440000/preferences`,
      body: { quietHours: { start: "22:00", end: "08:00", timezone: "UTC" } },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects invalid time string", async () => {
    await truncateAll();

    const res = await updatePreferences({
      quietHours: { start: "25:00", end: "08:00", timezone: "UTC" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ message: expect.stringContaining("Invalid time") });
  });

  it("rejects invalid timezone", async () => {
    await truncateAll();

    const res = await updatePreferences({
      quietHours: { start: "22:00", end: "08:00", timezone: "Foo/Bar" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ message: expect.stringContaining("Invalid timezone") });
  });
});
