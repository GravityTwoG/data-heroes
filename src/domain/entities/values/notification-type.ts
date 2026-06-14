import { Values } from "@/lib/typescript";

export const NotificationType = {
  MARKETING: "marketing",
  TRANSACTION: "transaction",
} as const;
export type NotificationType = Values<typeof NotificationType>;

export const validNotificationTypes = Object.values(NotificationType);

export const isNotificationTypeValid = (value: string): value is NotificationType => {
  return (validNotificationTypes as string[]).includes(value);
};
