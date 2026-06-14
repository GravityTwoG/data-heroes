import { Logger } from "@/lib/logger";
import {
  UserQuietHours,
  UserPreference,
} from "@/domain/entities/user-preferences";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";

type Params = {
  repositories: {
    userPreferences: IUserPreferencesRepository;
  };
  logger: Logger;
};

type UpdatePreferencesParams = {
  userId: string;
  channel?: UserPreference;
  quietHours?: UserQuietHours | null;
};

export const buildUpdatePreferences = (params: Params) => {
  const { userPreferences: userRepo } = params.repositories;
  const logger = params.logger;

  return async (dto: UpdatePreferencesParams): Promise<void> => {
    const { userId, channel, quietHours } = dto;

    await userRepo.upsert(userId, { preference: channel, quietHours });

    logger.info({ userId, channel, quietHours }, "preferences_updated");
  };
};
