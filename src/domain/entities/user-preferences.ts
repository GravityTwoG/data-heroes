import { NotificationChannel } from "./values/notification-channel";
import { NotificationType } from "./values/notification-type";

export type UserPreference = {
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
};

export type UserQuietHours = {
  start: string;
  end: string;
  timezone: string;
};

export type UserPreferences = {
  userId: string;
  channels: UserPreference[];
  quietHours: UserQuietHours | null;
};
