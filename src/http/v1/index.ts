import { FastifyInstance } from "fastify";

import { Logger } from "@/lib/logger";

import { UseCases } from "@/domain/usecases";

import { registerPreferncesRoutes } from "./preferences";

export const registerRoutes = ({
  app,
  useCases,
  logger,
}: {
  app: FastifyInstance;
  useCases: UseCases;
  logger: Logger;
}) => {
  const prefix = "/api/v1/users";

  app.register(registerPreferncesRoutes, {
    prefix,

    useCases: useCases.preferences,
    logger,
  });
};
