import {
  PrismaClient,
  UserPreference as PrismaUserPreference,
  UserQuietHours as PrismaUserQuietHours,
} from "@/generated/prisma/client";

import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";
import {
  UserPreference,
  UserQuietHours,
} from "@/domain/entities/user-preferences";
import { prismaQuery } from "./lib";

// Сейчас маппинг практически ничего не делает, но если модель хранения и
// доменная модель сильно разойдутся, то маппинг уже будет централизован в одном месте
const toUserPreference = (record: PrismaUserPreference): UserPreference => ({
  channel: record.channel as UserPreference["channel"],
  type: record.type as UserPreference["type"],
  enabled: record.enabled,
});

const toQuietHours = (record: PrismaUserQuietHours): UserQuietHours => ({
  start: record.start,
  end: record.end,
  timezone: record.timezone,
});

export const buildUserPreferencesRepository = (
  prisma: PrismaClient,
): IUserPreferencesRepository => {
  const get = prismaQuery(async (userId: string) => {
    const where = { userId };

    const [channels, quietHours] = await Promise.all([
      prisma.userPreference.findMany({ where }),
      prisma.userQuietHours.findUnique({ where }),
    ]);

    if (channels.length === 0 && !quietHours) return null;

    return {
      userId,
      channels: channels.map(toUserPreference),
      quietHours: quietHours ? toQuietHours(quietHours) : null,
    };
  });

  return {
    get,

    getPreference: prismaQuery(async (filters) => {
      const record = await prisma.userPreference.findUnique({
        where: {
          userId_type_channel: {
            userId: filters.userId,
            type: filters.type,
            channel: filters.channel,
          },
        },
      });

      if (!record) return null;

      return toUserPreference(record);
    }),

    getQuietHours: prismaQuery(async (userId) => {
      const record = await prisma.userQuietHours.findUnique({
        where: { userId },
      });

      if (!record) return null;

      return toQuietHours(record);
    }),

    upsert: prismaQuery(async (userId, data) => {
      await prisma.$transaction(async (tx) => {
        if (data.preference) {
          await tx.userPreference.upsert({
            where: {
              userId_type_channel: {
                userId,
                type: data.preference.type,
                channel: data.preference.channel,
              },
            },
            create: {
              userId,
              type: data.preference.type,
              channel: data.preference.channel,
              enabled: data.preference.enabled,
            },
            update: { enabled: data.preference.enabled },
          });
        }

        if (data.quietHours === undefined) {
          return;
        }

        if (data.quietHours === null) {
          await tx.userQuietHours.delete({ where: { userId } });
        } else {
          await tx.userQuietHours.upsert({
            where: { userId },
            update: {
              start: data.quietHours.start,
              end: data.quietHours.end,
              timezone: data.quietHours.timezone,
            },
            create: {
              userId,
              start: data.quietHours.start,
              end: data.quietHours.end,
              timezone: data.quietHours.timezone,
            },
          });
        }
      });
    }),
  };
};
