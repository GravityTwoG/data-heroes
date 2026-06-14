import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { createApp } from "@/app";
import type { Config } from "@/config";
import { PrismaClient } from "@/generated/prisma/client";
import { DefaultPreference } from "@/domain/entities/default-preference";
import { GlobalPolicy } from "@/domain/entities/global-policy";

export async function createTestApp() {
  const config: Config = {
    nodeEnv: "development",
    isProduction: false,
    port: 0,
    databaseURL: process.env.DATABASE_URL!,
    databasePoolConnectionsLimit: 1,
  };

  const app = await createApp({ config });
  await app.ready();

  return app;
}

function createDb() {
  return new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL! })),
  });
}

export async function truncateAll() {
  const db = createDb();
  try {
    await db.$executeRawUnsafe(
      `TRUNCATE TABLE "default_preferences", "user_preferences", "user_quiet_hours", "global_policies" RESTART IDENTITY CASCADE`,
    );
  } finally {
    await db.$disconnect();
  }
}

export async function seedDefaultPreferences(preferences: DefaultPreference[]) {
  const db = createDb();
  try {
    await db.defaultPreference.createMany({
      data: preferences.map((p) => ({
        type: p.type,
        channel: p.channel,
        enabled: p.enabled,
      })),
    });
  } finally {
    await db.$disconnect();
  }
}

export async function seedGlobalPolicies(policies: GlobalPolicy[]) {
  const db = createDb();
  try {
    await db.globalPolicy.createMany({
      data: policies.map((p) => ({
        type: p.type,
        channel: p.channel,
        region: p.region,
        enabled: p.enabled,
      })),
    });
  } finally {
    await db.$disconnect();
  }
}
