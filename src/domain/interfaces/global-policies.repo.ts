import { GlobalPolicy } from "@/domain/entities/global-policy";
import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { Region } from "@/domain/entities/values/region";

export interface IGlobalPoliciesRepository {
  get(filters: {
    type: NotificationType;
    channel: NotificationChannel;
    region: Region;
  }): Promise<GlobalPolicy | null>;
}
