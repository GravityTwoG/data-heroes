import { AsyncLocalStorage } from "node:async_hooks";

import { buildLogger } from "@/lib/logger";
import { Config } from "@/config";
import { buildRepositories } from "@/repositories";
import { buildUseCases } from "@/domain/usecases";
import { buildHTTPServer } from "@/http";

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

  const repositories = buildRepositories();

  const useCases = buildUseCases({ repositories });

  const httpServer = buildHTTPServer({
    useCases,
    config,
    logger,
    requestALS,
  });

  return httpServer;
};
