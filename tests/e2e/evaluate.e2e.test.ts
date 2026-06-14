import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyApp } from "@/http/types";

import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { Decision, Reason } from "@/domain/usecases/preferences/evaluate";
import {
  createTestApp,
  seedDefaultPreferences,
  seedGlobalPolicies,
  truncateAll,
} from "./helpers";

describe.sequential("POST /api/v1/users/:id/preferences/evaluate", () => {
  let app: FastifyApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const userId = "018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e8f";

  it("allows by default preferences when no user override", async () => {
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
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.ALLOW);
    expect(body.reason).toBe(Reason.ALLOWED_BY_DEFAULT_PREFERENCES);
  });

  it("blocks by global policy", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        enabled: true,
      },
    ]);
    await seedGlobalPolicies([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        region: "EU",
        enabled: false,
      },
    ]);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        region: "EU",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.DENY);
    expect(body.reason).toBe(Reason.BLOCKED_BY_GLOBAL_POLICY);
  });

  it("blocks by user preference when disabled", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    await app.inject({
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

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.DENY);
    expect(body.reason).toBe(Reason.BLOCKED_BY_USER_PREFERENCES);
  });

  it("allows transaction type during quiet hours", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "22:00", end: "06:00", timezone: "UTC" },
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: new Date("2024-12-15T23:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.ALLOW);
  });

  it("blocks non-transaction type during quiet hours", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "13:00", end: "15:00", timezone: "UTC" },
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.DENY);
    expect(body.reason).toBe(Reason.BLOCKED_BY_QUIET_HOURS);
  });

  it("allows by user preference when enabled", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        preference: {
          type: NotificationType.MARKETING,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.ALLOW);
    expect(body.reason).toBe(Reason.ALLOWED_BY_USER_PREFERENCES);
  });

  it("skips quiet hours and falls through to defaults when not in quiet hours", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ]);

    await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body: {
        quietHours: { start: "22:00", end: "06:00", timezone: "UTC" },
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.ALLOW);
    expect(body.reason).toBe(Reason.ALLOWED_BY_DEFAULT_PREFERENCES);
  });

  it("blocks by default when no default preference exists for the type-channel combo", async () => {
    await truncateAll();

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.PUSH,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.DENY);
    expect(body.reason).toBe(Reason.BLOCKED_BY_DEFAULT_PREFERENCES);
  });

  it("allows by global policy when enabled", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.PUSH,
        enabled: false,
      },
    ]);
    await seedGlobalPolicies([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.PUSH,
        region: "US",
        enabled: true,
      },
    ]);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.PUSH,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.ALLOW);
    expect(body.reason).toBe(Reason.ALLOWED_BY_GLOBAL_POLICY);
  });

  it("blocks by default preference when disabled", async () => {
    await truncateAll();
    await seedDefaultPreferences([
      {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.WHATSAPP,
        enabled: false,
      },
    ]);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.WHATSAPP,
        region: "US",
        datetime: new Date("2024-12-15T14:00:00Z").toISOString(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.decision).toBe(Decision.DENY);
    expect(body.reason).toBe(Reason.BLOCKED_BY_DEFAULT_PREFERENCES);
  });
});
