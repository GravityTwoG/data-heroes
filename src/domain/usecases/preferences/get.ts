import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";

import {
  UserPreference,
  UserPreferences,
} from "@/domain/entities/user-preferences";

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
  const { defaultPreferences: defaultRepo, userPreferences: userRepo } =
    params.repositories;

  return async (dto: GetPreferencesParams): Promise<UserPreferences> => {
    const [defaults, userPrefs] = await Promise.all([
      defaultRepo.list(),
      userRepo.get(dto.userId),
    ]);

    const channelMap = new Map<string, UserPreference>();

    for (const d of defaults.concat(userPrefs?.channels ?? [])) {
      channelMap.set(`${d.type}:${d.channel}`, d);
    }

    return {
      userId: dto.userId,
      channels: Array.from(channelMap.values()),
      quietHours: userPrefs?.quietHours ?? null,
    } as UserPreferences;
  };
};
