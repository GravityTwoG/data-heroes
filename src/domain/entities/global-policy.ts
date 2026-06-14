import { NotificationChannel } from "./values/notification-channel";
import { NotificationType } from "./values/notification-type";
import { Region } from "./values/region";

export type GlobalPolicy = {
  type: NotificationType;
  channel: NotificationChannel;
  region: Region;
  enabled: boolean;
};
