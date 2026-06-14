import { Repositories } from "@/domain/interfaces/repo";

import { PrismaClient } from "@/generated/prisma/client";

import { buildDefaultPreferencesRepository } from "./default-preferences.repo";
import { buildGlobalPoliciesRepository } from "./global-policies.repo";
import { buildUserPreferencesRepository } from "./user-preferences.repo";

export const buildRepositories = (prisma: PrismaClient): Repositories => {
  return {
    defaultPreferences: buildDefaultPreferencesRepository(prisma),
    userPreferences: buildUserPreferencesRepository(prisma),
    globalPolicies: buildGlobalPoliciesRepository(prisma),
  };
};
