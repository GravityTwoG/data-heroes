import { NotificationChannel } from "../entities/notification-channel";
import { NotificationType } from "../entities/notification-type";
import { UserPreference, UserPreferences } from "../entities/user-preferences";

export interface IUserPreferencesRepository {
  get(userId: string): Promise<UserPreferences>;
  getPreference(filters: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
  }): Promise<UserPreference>;

  upsert(userId: string, data: UserPreferences): Promise<UserPreferences>;
}
