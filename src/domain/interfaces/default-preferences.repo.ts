import { DefaultPreference } from "../entities/default-preference";
import { NotificationChannel } from "../entities/values/notification-channel";
import { NotificationType } from "../entities/values/notification-type";

export interface IDefaultPreferencesRepository {
  list(): Promise<DefaultPreference[]>;
  get(filters: {
    type: NotificationType;
    channel: NotificationChannel;
  }): Promise<DefaultPreference | null>;
}
