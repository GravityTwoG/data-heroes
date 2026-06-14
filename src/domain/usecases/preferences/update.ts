import {
  UserQuietHours,
  UserPreference,
  UserPreferences,
} from "@/domain/entities/user-preferences";
import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";

type Params = {
  repositories: {
    defaultPreferences: IDefaultPreferencesRepository;
    userPreferences: IUserPreferencesRepository;
  };
};

type UpdatePreferencesParams = {
  userId: string;
  channels?: UserPreference[];
  quietHours?: UserQuietHours | null;
};

export const buildUpdatePreferences = (params: Params) => {
  return (dto: UpdatePreferencesParams): Promise<UserPreferences> => {};
};
