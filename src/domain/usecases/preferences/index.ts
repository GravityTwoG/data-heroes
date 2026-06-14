import { Logger } from "@/lib/logger";

import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { IGlobalPoliciesRepository } from "@/domain/interfaces/global-policies.repo";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";

import { buildEvaluatePreferences } from "./evaluate";
import { buildGetPreferences } from "./get";
import { buildUpdatePreferences } from "./update";

export const buildPreferences = (params: {
  repositories: {
    defaultPreferences: IDefaultPreferencesRepository;
    userPreferences: IUserPreferencesRepository;
    globalPolicies: IGlobalPoliciesRepository;
  };
  logger: Logger;
}) => {
  return {
    getPreferences: buildGetPreferences(params),
    updatePreferences: buildUpdatePreferences(params),
    evaluatePreferences: buildEvaluatePreferences(params),
  };
};

export type PreferencesUseCases = ReturnType<typeof buildPreferences>;
