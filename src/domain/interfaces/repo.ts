import { IDefaultPreferencesRepository } from "./default-preferences.repo";
import { IGlobalPoliciesRepository } from "./global-policies.repo";
import { IUserPreferencesRepository } from "./user-preferences.repo";

export type Repositories = {
  defaultPreferences: IDefaultPreferencesRepository;
  userPreferences: IUserPreferencesRepository;
  globalPolicies: IGlobalPoliciesRepository;
};
