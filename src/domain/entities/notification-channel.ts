import { Values } from "@/lib/typescript";

export const NotificationChannel = {
  EMAIL: "email",
  SMS: "sms",
  TELEGRAM: "telegram",
  WHATSAPP: "whatsapp",
  MAX: "max",
  PUSH: "push",
} as const;
export type NotificationChannel = Values<typeof NotificationChannel>;

export const validNotificationChannels = Object.values(
  NotificationChannel,
);

export const isNotificationChannelValid = (value: string) => {
  return (validNotificationChannels as string[]).includes(value);
};
