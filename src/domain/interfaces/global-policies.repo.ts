import { GlobalPolicy } from "../entities/global-policy";
import { NotificationChannel } from "../entities/notification-channel";
import { NotificationType } from "../entities/notification-type";
import { Region } from "../entities/region";

export interface IGlobalPoliciesRepository {
  get(filters: {
    type: NotificationType;
    channel: NotificationChannel;
    region: Region;
  }): Promise<GlobalPolicy | null>;
}
