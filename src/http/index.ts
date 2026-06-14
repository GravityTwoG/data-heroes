import { AsyncLocalStorage } from "node:async_hooks";

import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify from "fastify";

import { Logger } from "@/lib/logger";

import type { UseCases } from "@/domain/usecases";

import { Config } from "@/config";

import { registerErrorHandler } from "./lib/error-handler";
import { registerRequestContext } from "./lib/request-context";
import { registerSwagger } from "./lib/swagger";
import type { FastifyApp } from "./types";
import { registerRoutes } from "./v1";

export function buildHTTPServer({
  useCases,
  config,
  logger,
  requestALS,
}: {
  useCases: UseCases;
  config: Pick<Config, "isProduction">;
  logger: Logger;
  requestALS: AsyncLocalStorage<{ requestId: string }>;
}): FastifyApp {
  const app = Fastify({
    loggerInstance: logger,
    trustProxy: 1,

    genReqId: (req) =>
      (req.headers["x-request-id"] as string) ?? crypto.randomUUID(),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  if (!config.isProduction) {
    registerSwagger(app);
  }

  registerRequestContext({
    app,
    requestALS,
    onRequest: (req, _, done) => {
      const store = requestALS.getStore();
      if (store) {
        store.requestId = req.id;
      }
      done();
    },
  });

  registerErrorHandler(app);

  registerRoutes({ app, useCases, logger });

  return app;
}
