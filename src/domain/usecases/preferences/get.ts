import { UserPreferences } from "@/domain/entities/user-preferences";
import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";

type Params = {
  repositories: {
    defaultPreferences: IDefaultPreferencesRepository;
    userPreferences: IUserPreferencesRepository;
  };
};

type GetPreferencesParams = {
  userId: string;
};

export const buildGetPreferences = (params: Params) => {
  return (dto: GetPreferencesParams): Promise<UserPreferences> => {};
};
