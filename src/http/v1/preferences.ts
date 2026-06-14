import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import type { UseCases } from "@/domain/usecases";
import { ErrorSchema } from "../lib/error-schema";
import { Logger } from "@/lib/logger";
import { OpenAPIOperationId } from "../lib/openapi-operation-ids";
import { validNotificationChannels } from "@/domain/entities/notification-channel";
import { validNotificationTypes } from "@/domain/entities/notification-type";

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
  channels: z.array(ChannelSchema).optional(),
  quietHours: z
    .object({
      start: z.string(),
      end: z.string(), // TODO: validate time
      timezone: z.string(), // TODO: validate timezone
    })
    .nullable()
    .optional(),
});

const EvaluatePreferencesSchema = z.object({
  channel: NotificationChannelSchema,
  type: NotificationTypeSchema,
  region: z.string(), // TODO: set format
  datetime: z.date(), // TODO: set format
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
        200: UserPreferencesSchema,
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
        200: UserPreferencesSchema,
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
