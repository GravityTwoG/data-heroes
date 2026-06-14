import { NotificationChannel } from "./values/notification-channel";
import { NotificationType } from "./values/notification-type";

export type DefaultPreference = {
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
};
