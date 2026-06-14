import { DefaultPreference } from "../entities/default-preference";
import { NotificationChannel } from "../entities/notification-channel";
import { NotificationType } from "../entities/notification-type";
import { Region } from "../entities/region";

export interface IDefaultPreferencesRepository {
  list(): Promise<DefaultPreference[]>;
  get(filters: {
    type: NotificationType;
    channel: NotificationChannel;
    region: Region;
  }): Promise<DefaultPreference>;
}
