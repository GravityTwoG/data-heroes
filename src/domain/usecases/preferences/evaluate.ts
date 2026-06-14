import { NotificationChannel } from "@/domain/entities/notification-channel";
import { NotificationType } from "@/domain/entities/notification-type";
import { Region } from "@/domain/entities/region";
import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { IGlobalPoliciesRepository } from "@/domain/interfaces/global-policies.repo";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";

type Params = {
  repositories: {
    defaultPreferences: IDefaultPreferencesRepository;
    userPreferences: IUserPreferencesRepository;
    globalPolicies: IGlobalPoliciesRepository;
  };
};

type EvaluatePreferencesParams = {
  userId: string;

  type: NotificationType;
  channel: NotificationChannel;
  region: Region;
  datetime: Date;
};

export const buildEvaluatePreferences = (params: Params) => {
  return (dto: EvaluatePreferencesParams) => {};
};
