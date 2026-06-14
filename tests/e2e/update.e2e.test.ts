import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";

import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { DefaultPreference } from "@/domain/entities/default-preference";
import { createTestApp, truncateAll, seedDefaultPreferences } from "./helpers";

describe.sequential("POST /api/v1/users/:id/preferences", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const userId = "018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e7f";

  it("updates a single preference", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        preference: {
          type: NotificationType.MARKETING,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
      },
    });

    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/users/${userId}/preferences`,
    });

    const body = JSON.parse(getRes.body);
    const pref = body.channels.find(
      (c: any) =>
        c.type === NotificationType.MARKETING &&
        c.channel === NotificationChannel.EMAIL,
    );
    expect(pref.enabled).toBe(false);
  });

  it("upserts quiet hours", async () => {
    await truncateAll();

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "22:00", end: "08:00", timezone: "Europe/Moscow" },
      },
    });

    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/users/${userId}/preferences`,
    });

    const body = JSON.parse(getRes.body);
    expect(body.quietHours).toEqual({
      start: "22:00",
      end: "08:00",
      timezone: "Europe/Moscow",
    });
  });

  it("removes quiet hours when null", async () => {
    await truncateAll();

    await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "22:00", end: "08:00", timezone: "Europe/Moscow" },
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: { quietHours: null },
    });

    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/users/${userId}/preferences`,
    });

    const body = JSON.parse(getRes.body);
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

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
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
      },
    });

    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/users/${userId}/preferences`,
    });

    const body = JSON.parse(getRes.body);
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

  it("rejects invalid time string", async () => {
    await truncateAll();

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "25:00", end: "08:00", timezone: "UTC" },
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects invalid timezone", async () => {
    await truncateAll();

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "22:00", end: "08:00", timezone: "Foo/Bar" },
      },
    });

    expect(res.statusCode).toBe(400);
  });
});
