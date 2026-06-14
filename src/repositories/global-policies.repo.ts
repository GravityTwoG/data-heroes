import {
  PrismaClient,
  GlobalPolicy as PrismaGlobalPolicy,
} from "@/generated/prisma/client";

import { GlobalPolicy } from "@/domain/entities/global-policy";
import { IGlobalPoliciesRepository } from "@/domain/interfaces/global-policies.repo";
import { prismaQuery } from "./lib";

const toEntity = (record: PrismaGlobalPolicy): GlobalPolicy => ({
  channel: record.channel as GlobalPolicy["channel"],
  type: record.type as GlobalPolicy["type"],
  enabled: record.enabled,
  region: record.region as GlobalPolicy["region"],
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
