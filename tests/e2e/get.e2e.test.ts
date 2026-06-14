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

  it("returns default preferences for a user with no overrides", async () => {
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
        type: NotificationType.MARKETING,
        channel: NotificationChannel.MAX,
        enabled: true,
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
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
    ]);

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/users/018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e6f/preferences`,
    });

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.userId).toBe("018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e6f");
    expect(body.channels).toBeInstanceOf(Array);
    expect(body.channels.length).toBe(11);
    expect(body.quietHours).toBeNull();
  });
});
