import { NotificationChannel } from "./notification-channel";
import { NotificationType } from "./notification-type";
import { Region } from "./region";

export type GlobalPolicy = {
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
  region: Region;
};
