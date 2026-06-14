import { Logger } from "@/lib/logger";

import { UseCases } from "@/domain/usecases";

import type { FastifyApp } from "../types";
import { registerPreferncesRoutes } from "./preferences";

export const registerRoutes = ({
  app,
  useCases,
  logger,
}: {
  app: FastifyApp;
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
