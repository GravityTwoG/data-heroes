import { NotificationChannel } from "../entities/values/notification-channel";
import { NotificationType } from "../entities/values/notification-type";
import {
  UserPreference,
  UserPreferences,
  UserQuietHours,
} from "../entities/user-preferences";

export interface IUserPreferencesRepository {
  get(userId: string): Promise<UserPreferences | null>;

  getPreference(filters: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
  }): Promise<UserPreference | null>;

  getQuietHours(userId: string): Promise<UserQuietHours | null>;

  upsert(
    userId: string,
    data: {
      preference?: UserPreference;
      quietHours?: UserQuietHours | null;
    },
  ): Promise<void>;
}
