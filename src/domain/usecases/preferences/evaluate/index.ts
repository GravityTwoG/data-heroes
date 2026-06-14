import { Values } from "@/lib/typescript";
import { Logger } from "@/lib/logger";
import { NotificationChannel } from "@/domain/entities/values/notification-channel";
import { NotificationType } from "@/domain/entities/values/notification-type";
import { Region } from "@/domain/entities/values/region";
import { IDefaultPreferencesRepository } from "@/domain/interfaces/default-preferences.repo";
import { IGlobalPoliciesRepository } from "@/domain/interfaces/global-policies.repo";
import { IUserPreferencesRepository } from "@/domain/interfaces/user-preferences.repo";
import { isInQuietHours } from "./is-in-quiet-hours";

export const Decision = {
  ALLOW: "allow",
  DENY: "deny",
} as const;
export type Decision = Values<typeof Decision>;

export const Reason = {
  ALLOWED_BY_GLOBAL_POLICY: "allowed_by_global_policy",
  ALLOWED_BY_USER_PREFERENCES: "allowed_by_user_preferences",
  ALLOWED_BY_DEFAULT_PREFERENCES: "allowed_by_default_preferences",

  BLOCKED_BY_GLOBAL_POLICY: "blocked_by_global_policy",
  BLOCKED_BY_USER_PREFERENCES: "blocked_by_user_preferences",
  BLOCKED_BY_QUIET_HOURS: "blocked_by_quiet_hours",
  BLOCKED_BY_DEFAULT_PREFERENCES: "blocked_by_default_preferences",
} as const;
export type Reason = Values<typeof Reason>;

type EvaluateResult = {
  decision: Decision;
  reason: Reason;
};

type Params = {
  repositories: {
    defaultPreferences: IDefaultPreferencesRepository;
    userPreferences: IUserPreferencesRepository;
    globalPolicies: IGlobalPoliciesRepository;
  };
  logger: Logger;
};

type EvaluatePreferencesParams = {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  region: Region;
  datetime: Date;
};

export const buildEvaluatePreferences = (params: Params) => {
  const {
    defaultPreferences: defaultRepo,
    userPreferences: userRepo,
    globalPolicies: globalRepo,
  } = params.repositories;
  const logger = params.logger;

  return async (dto: EvaluatePreferencesParams): Promise<EvaluateResult> => {
    const { userId, type, channel, region, datetime } = dto;

    const policy = await globalRepo.get({ type, channel, region });
    if (policy) {
      const result: EvaluateResult = policy.enabled
        ? { decision: Decision.ALLOW, reason: Reason.ALLOWED_BY_GLOBAL_POLICY }
        : { decision: Decision.DENY, reason: Reason.BLOCKED_BY_GLOBAL_POLICY };

      logger.info({ userId, type, channel, region, result }, "evaluated");

      return result;
    }

    const quietHours = await userRepo.getQuietHours(userId);
    if (quietHours && isInQuietHours(datetime, quietHours)) {
      if (type !== NotificationType.TRANSACTION) {
        const result: EvaluateResult = {
          decision: Decision.DENY,
          reason: Reason.BLOCKED_BY_QUIET_HOURS,
        };
        logger.info({ userId, type, channel, region, result }, "evaluated");
        return result;
      }
    }

    const userPref = await userRepo.getPreference({ userId, type, channel });
    if (userPref) {
      const result: EvaluateResult = userPref.enabled
        ? {
            decision: Decision.ALLOW,
            reason: Reason.ALLOWED_BY_USER_PREFERENCES,
          }
        : {
            decision: Decision.DENY,
            reason: Reason.BLOCKED_BY_USER_PREFERENCES,
          };

      logger.info({ userId, type, channel, region, result }, "evaluated");
      return result;
    }

    const defaultPref = await defaultRepo.get({ type, channel });
    if (defaultPref) {
      const result: EvaluateResult = defaultPref.enabled
        ? {
            decision: Decision.ALLOW,
            reason: Reason.ALLOWED_BY_DEFAULT_PREFERENCES,
          }
        : {
            decision: Decision.DENY,
            reason: Reason.BLOCKED_BY_DEFAULT_PREFERENCES,
          };
      logger.info({ userId, type, channel, region, ...result }, "evaluated");
      return result;
    }

    // denied if nothing found
    const result: EvaluateResult = {
      decision: Decision.DENY,
      reason: Reason.BLOCKED_BY_DEFAULT_PREFERENCES,
    };
    logger.info({ userId, type, channel, region, ...result }, "evaluated");
    return result;
  };
};
