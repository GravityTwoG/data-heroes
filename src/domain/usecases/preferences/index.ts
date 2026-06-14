import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { buildEvaluatePreferences } from "./evaluate";
import { buildGetPreferences } from "./get";
import { buildUpdatePreferences } from "./update";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";
import { IGlobalPoliciesRepository } from "@/domain/interfaces/global-policies.repo";

export const buildPreferences = (params: {
  repositories: {
    defaultPreferences: IDefaultPreferencesRepository;
    userPreferences: IUserPreferencesRepository;
    globalPolicies: IGlobalPoliciesRepository;
  };
}) => {
  return {
    getPreferences: buildGetPreferences(params),
    updatePreferences: buildUpdatePreferences(params),
    evaluatePreferences: buildEvaluatePreferences(params),
  };
};

export type PreferencesUseCases = ReturnType<typeof buildPreferences>;
