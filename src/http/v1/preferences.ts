import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import { Logger } from "@/lib/logger";
import { validNotificationChannels } from "@/domain/entities/values/notification-channel";
import { validNotificationTypes } from "@/domain/entities/values/notification-type";
import { isRegionValid } from "@/domain/entities/values/region";
import { isTimeValid } from "@/domain/entities/values/is-time-valid";
import { isTimezoneValid } from "@/domain/entities/values/is-timezone-valid";

import { Decision } from "@/domain/usecases/preferences/evaluate";
import type { UseCases } from "@/domain/usecases";
import { ErrorSchema } from "../lib/error-schema";
import { OpenAPIOperationId } from "../lib/openapi-operation-ids";

const TimeStringSchema = z.string().refine(isTimeValid, {
  message: "Invalid time",
});

const TimezoneSchema = z.string().refine(isTimezoneValid, {
  message: "Invalid timezone",
});

const NotificationChannelSchema = z.enum(validNotificationChannels);

const NotificationTypeSchema = z.enum(validNotificationTypes);

const RegionSchema = z
  .string()
  .refine(isRegionValid, { message: "Invalid region code" });

const ChannelSchema = z.object({
  channel: NotificationChannelSchema,
  type: NotificationTypeSchema,
  enabled: z.boolean(),
});

const UserPreferencesSchema = z.object({
  userId: z.string(),
  channels: z.array(ChannelSchema),
  quietHours: z
    .object({
      start: z.string(),
      end: z.string(),
      timezone: z.string(),
    })
    .nullable(),
});

const UpdateUserPreferencesSchema = z.object({
  preference: ChannelSchema.optional(),
  quietHours: z
    .object({
      start: TimeStringSchema,
      end: TimeStringSchema,
      timezone: TimezoneSchema,
    })
    .nullable()
    .optional(),
});

const EvaluatePreferencesSchema = z.object({
  channel: NotificationChannelSchema,
  type: NotificationTypeSchema,
  region: RegionSchema,
  datetime: z.coerce.date(),
});

const EvaluateResultSchema = z.object({
  decision: z.enum(Object.values(Decision)),
  reason: z.string(),
});

export const registerPreferncesRoutes: FastifyPluginAsyncZod<{
  useCases: UseCases["preferences"];
  logger: Logger;
}> = async (app, { useCases, logger }) => {
  app.get("/:id/preferences", {
    schema: {
      operationId: OpenAPIOperationId.GET_PREFERENCES,
      params: z.object({ id: z.uuidv7() }),
      response: {
        200: UserPreferencesSchema,
        400: ErrorSchema,
      },
    },
    handler: async (req) => {
      logger.info("hello");
      return useCases.getPreferences({
        userId: req.params.id,
      });
    },
  });

  app.post("/:id/preferences", {
    schema: {
      operationId: OpenAPIOperationId.UPDATE_PREFERENCES,
      params: z.object({ id: z.uuidv7() }),
      body: UpdateUserPreferencesSchema,
      response: {
        400: ErrorSchema,
      },
    },
    handler: async (req) => {
      return useCases.updatePreferences({
        ...req.body,

        userId: req.params.id,
      });
    },
  });

  app.post("/:id/preferences/evaluate", {
    schema: {
      operationId: OpenAPIOperationId.EVALUATE_PREFERENCES,
      params: z.object({ id: z.uuidv7() }),
      body: EvaluatePreferencesSchema,
      response: {
        200: EvaluateResultSchema,
        400: ErrorSchema,
      },
    },
    handler: async (req) => {
      return useCases.evaluatePreferences({
        ...req.body,

        userId: req.params.id,
      });
    },
  });
};
