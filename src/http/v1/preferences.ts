import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import { Logger } from "@/lib/logger";
import { validNotificationChannels } from "@/domain/entities/notification-channel";
import { validNotificationTypes } from "@/domain/entities/notification-type";
import type { UseCases } from "@/domain/usecases";
import { ErrorSchema } from "../lib/error-schema";
import { OpenAPIOperationId } from "../lib/openapi-operation-ids";

import { TimeStringSchema } from "../lib/time-schema";
import { TimezoneSchema } from "../lib/timezone-schema";

const NotificationChannelSchema = z.enum(validNotificationChannels);

const NotificationTypeSchema = z.enum(validNotificationTypes);

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
  region: z.string(), // TODO: set format
  datetime: z.coerce.date(), // TODO: set format
});

const EvaluateResultSchema = z.object({
  decision: z.enum(["allow", "deny"]),
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
      const { preference, quietHours } = req.body;

      return useCases.updatePreferences({
        userId: req.params.id,
        channel: preference,
        quietHours,
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
