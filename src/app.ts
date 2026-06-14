import { AsyncLocalStorage } from "node:async_hooks";

import { buildLogger } from "@/lib/logger";
import { buildPrismaClient } from "@/lib/prisma";

import { buildUseCases } from "@/domain/usecases";

import { Config } from "@/config";
import { buildHTTPServer } from "@/http";
import { buildRepositories } from "@/repositories";

export const createApp = async ({ config }: { config: Config }) => {
  const requestALS = new AsyncLocalStorage<{ requestId: string }>();

  const logger = buildLogger(requestALS);

  process.on("uncaughtException", (err) => {
    logger.error({
      location: "app.uncaughtException",
      message: "uncaught exception",
      err,
    });
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({
      location: "app.unhandledRejection",
      message: "unhandled rejection",
      reason,
    });
  });

  const prisma = buildPrismaClient({
    databaseURL: config.databaseURL,
    poolConnectionsLimit: config.databasePoolConnectionsLimit,
  });

  const repositories = buildRepositories(prisma);

  const useCases = buildUseCases({ repositories, logger });

  const httpServer = buildHTTPServer({
    useCases,
    config,
    logger,
    requestALS,
  });

  return httpServer;
};
