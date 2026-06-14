import {
  PrismaClient,
  DefaultPreference as PrismaDefaultPreference,
} from "@/generated/prisma/client";

import { DefaultPreference } from "@/domain/entities/default-preference";
import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { prismaQuery } from "./lib";

const toEntity = (record: PrismaDefaultPreference): DefaultPreference => ({
  channel: record.channel as DefaultPreference["channel"],
  type: record.type as DefaultPreference["type"],
  enabled: record.enabled,
});

export const buildDefaultPreferencesRepository = (
  prisma: PrismaClient,
): IDefaultPreferencesRepository => {
  return {
    list: prismaQuery(async () => {
      const records = await prisma.defaultPreference.findMany();
      return records.map(toEntity);
    }),

    get: prismaQuery(async (filters) => {
      const record = await prisma.defaultPreference.findUnique({
        where: {
          type_channel: {
            type: filters.type,
            channel: filters.channel,
          },
        },
      });

      if (!record) return null;

      return toEntity(record);
    }),
  };
};
