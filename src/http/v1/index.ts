import { UseCases } from "@/domain/usecases";
import { Logger } from "@/lib/logger";
import { FastifyInstance } from "fastify";
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
