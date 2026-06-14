import {
  PrismaClient,
  GlobalPolicy as PrismaGlobalPolicy,
} from "@/generated/prisma/client";

import { GlobalPolicy } from "@/domain/entities/global-policy";
import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { Region } from "@/domain/entities/values/region";
import { IGlobalPoliciesRepository } from "@/domain/interfaces/global-policies.repo";
import { prismaQuery } from "./lib";

const toEntity = (record: PrismaGlobalPolicy): GlobalPolicy => ({
  channel: record.channel as NotificationChannel,
  type: record.type as NotificationType,
  region: record.region as Region,
  enabled: record.enabled,
});

export const buildGlobalPoliciesRepository = (
  prisma: PrismaClient,
): IGlobalPoliciesRepository => {
  return {
    get: prismaQuery(async (filters) => {
      const record = await prisma.globalPolicy.findUnique({
        where: {
          type_channel_region: {
            type: filters.type,
            channel: filters.channel,
            region: filters.region,
          },
        },
      });

      if (!record) return null;

      return toEntity(record);
    }),
  };
};
