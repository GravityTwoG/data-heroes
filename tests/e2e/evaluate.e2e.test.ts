import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyApp } from "@/http/types";

import { DefaultPreference } from "@/domain/entities/default-preference";
import { GlobalPolicy } from "@/domain/entities/global-policy";
import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { Decision, Reason } from "@/domain/usecases/preferences/evaluate";
import {
  createTestApp,
  seedDefaultPreferences,
  seedGlobalPolicies,
  truncateAll,
} from "./helpers";

type EvaluateCase = {
  name: string;
  seed?: { defaults?: DefaultPreference[]; policies?: GlobalPolicy[] };
  userSetup?: () => Promise<unknown>;
  input: {
    type: NotificationType;
    channel: NotificationChannel;
    region: string;
    datetime: string;
  };
  expected: { decision: Decision; reason: Reason };
};

describe.sequential("POST /api/v1/users/:id/preferences/evaluate", () => {
  let app: FastifyApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const userId = "018f3a6e-1f3c-7a5e-b8d4-1a2b3c4d5e8f";

  const evaluate = (params: {
    type: NotificationType;
    channel: NotificationChannel;
    region: string;
    datetime: string;
  }) =>
    app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences/evaluate`,
      body: params,
    });

  const setPreferences = (body: object) =>
    app.inject({
      method: "POST",
      url: `/api/v1/users/${userId}/preferences`,
      body,
    });

  const DT = {
    day: "2024-12-15T14:00:00Z", // 14:00 UTC — business hours
    night: "2024-12-15T23:00:00Z", // 23:00 UTC — night
  } as const;

  const cases: EvaluateCase[] = [
    // ─── Default preferences ──────────────────────────────────────────────────
    {
      name: "allows when default preference is enabled",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
      },
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.ALLOW,
        reason: Reason.ALLOWED_BY_DEFAULT_PREFERENCES,
      },
    },
    {
      name: "denies when default preference is disabled",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: false,
          },
        ],
      },
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_DEFAULT_PREFERENCES,
      },
    },
    {
      name: "denies when no default exists for the type-channel combo",
      seed: { defaults: [] },
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.PUSH,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_DEFAULT_PREFERENCES,
      },
    },

    // ─── User preference overrides ────────────────────────────────────────────
    {
      name: "blocks when user disabled (default is enabled)",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          preference: {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: false,
          },
        }),
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_USER_PREFERENCES,
      },
    },
    {
      name: "allows when user enabled (default is disabled)",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: false,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          preference: {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        }),
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.ALLOW,
        reason: Reason.ALLOWED_BY_USER_PREFERENCES,
      },
    },

    // ─── Quiet hours ──────────────────────────────────────────────────────────
    {
      name: "blocks MARKETING during quiet hours",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          quietHours: { start: "13:00", end: "15:00", timezone: "UTC" },
        }),
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_QUIET_HOURS,
      },
    },
    {
      name: "allows MARKETING outside quiet hours (falls through to defaults)",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          quietHours: { start: "22:00", end: "06:00", timezone: "UTC" },
        }),
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.ALLOW,
        reason: Reason.ALLOWED_BY_DEFAULT_PREFERENCES,
      },
    },
    {
      name: "allows TRANSACTION during quiet hours (transactions are exempt)",
      seed: {
        defaults: [
          {
            type: NotificationType.TRANSACTION,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          quietHours: { start: "22:00", end: "06:00", timezone: "UTC" },
        }),
      input: {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.night,
      },
      expected: {
        decision: Decision.ALLOW,
        reason: Reason.ALLOWED_BY_DEFAULT_PREFERENCES,
      },
    },
    {
      name: "blocks TRANSACTION during quiet hours by user preference when disabled",
      seed: {
        defaults: [
          {
            type: NotificationType.TRANSACTION,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          preference: {
            type: NotificationType.TRANSACTION,
            channel: NotificationChannel.EMAIL,
            enabled: false,
          },
          quietHours: { start: "22:00", end: "06:00", timezone: "UTC" },
        }),
      input: {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.night,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_USER_PREFERENCES,
      },
    },
    {
      name: "blocks TRANSACTION during quiet hours by default preference when disabled",
      seed: {
        defaults: [
          {
            type: NotificationType.TRANSACTION,
            channel: NotificationChannel.EMAIL,
            enabled: false,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          quietHours: { start: "22:00", end: "06:00", timezone: "UTC" },
        }),
      input: {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        region: "US",
        datetime: DT.night,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_DEFAULT_PREFERENCES,
      },
    },

    // ─── Global policies ──────────────────────────────────────────────────────
    {
      name: "blocks by global policy",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.SMS,
            enabled: true,
          },
        ],
        policies: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.SMS,
            region: "EU",
            enabled: false,
          },
        ],
      },
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.SMS,
        region: "EU",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_GLOBAL_POLICY,
      },
    },
    // MAX: blocked in EU, falls through to defaults in RU
    {
      name: "allows MAX in Russia when global policy only blocks Europe",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.MAX,
            enabled: true,
          },
        ],
        policies: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.MAX,
            region: "EU",
            enabled: false,
          },
        ],
      },
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.MAX,
        region: "RU",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.ALLOW,
        reason: Reason.ALLOWED_BY_DEFAULT_PREFERENCES,
      },
    },
    {
      name: "blocks MAX in Europe by global policy",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.MAX,
            enabled: true,
          },
        ],
        policies: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.MAX,
            region: "EU",
            enabled: false,
          },
        ],
      },
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.MAX,
        region: "EU",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_GLOBAL_POLICY,
      },
    },
    // Global policy takes priority over user preferences
    {
      name: "global policy blocks even when user explicitly enabled",
      seed: {
        defaults: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        ],
        policies: [
          {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            region: "EU",
            enabled: false,
          },
        ],
      },
      userSetup: () =>
        setPreferences({
          preference: {
            type: NotificationType.MARKETING,
            channel: NotificationChannel.EMAIL,
            enabled: true,
          },
        }),
      input: {
        type: NotificationType.MARKETING,
        channel: NotificationChannel.EMAIL,
        region: "EU",
        datetime: DT.day,
      },
      expected: {
        decision: Decision.DENY,
        reason: Reason.BLOCKED_BY_GLOBAL_POLICY,
      },
    },
  ];

  it.each(cases)("$name", async ({ seed, userSetup, input, expected }) => {
    await truncateAll();
    if (seed?.defaults) await seedDefaultPreferences(seed.defaults);
    if (seed?.policies) await seedGlobalPolicies(seed.policies);
    if (userSetup) await userSetup();

    const res = await evaluate(input);

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.decision).toBe(expected.decision);
    expect(body.reason).toBe(expected.reason);
  });
});
