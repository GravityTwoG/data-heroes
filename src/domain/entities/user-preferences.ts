import { NotificationChannel } from "./notification-channel";
import { NotificationType } from "./notification-type";

export type UserPreference = {
  channel: NotificationChannel;
  type: NotificationType;
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
