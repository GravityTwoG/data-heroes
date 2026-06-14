import { NotificationChannel } from "./notification-channel";
import { NotificationType } from "./notification-type";

export type DefaultPreference = {
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
};
