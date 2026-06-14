import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyApp } from "@/http/types";

import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { createTestApp, seedDefaultPreferences, truncateAll } from "./helpers";

describe.sequential("GET /api/v1/users/:id/preferences", () => {
  let app: FastifyApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const getPreferences = (uid: string) =>
    app.inject({ method: "GET", url: `/api/v1/users/${uid}/preferences` });

  const updatePreferences = (uid: string, body: object) =>
    app.inject({ method: "POST", url: `/api/v1/users/${uid}/preferences`, body });

  it("returns default preferences for a user with no overrides", async () => {
    const userId = "018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e6f";

    await truncateAll();
    const defaultPreferences = [
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.MAX,
        enabled: true,
      },
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        enabled: true,
      },
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.TELEGRAM,
        enabled: true,
      },
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.WHATSAPP,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.MAX,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.PUSH,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.SMS,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.TELEGRAM,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.WHATSAPP,
        enabled: true,
      },
    ];
    await seedDefaultPreferences(defaultPreferences);

    const res = await getPreferences(userId);

    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.userId).toBe(userId);
    expect(body.channels).toBeInstanceOf(Array);
    expect(body.channels.length).toBe(11);
    expect(body.channels).toEqual(defaultPreferences);
    expect(body.quietHours).toBeNull();
  });

  it("merges default and user preferences — user override wins, untouched defaults remain", async () => {
    const userId = "018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e9f";

    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        enabled: true,
      },
    ]);

    // user disables EMAIL, leaves SMS untouched
    await updatePreferences(userId, {
      preference: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      },
    });

    const res = await getPreferences(userId);

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.channels).toEqual([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      }, // user override
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        enabled: true,
      }, // default unchanged
    ]);
  });
});
