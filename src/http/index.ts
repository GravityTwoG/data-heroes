import { AsyncLocalStorage } from "node:async_hooks";

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance } from "fastify";

import { Config } from "@/config";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableError,
} from "@/domain/entities/error";
import type { UseCases } from "@/domain/usecases";

import { registerRoutes } from "./v1";
import { withNamedOperationSchemas } from "./lib/openapi-components";
import { registerRequestContext } from "./lib/request-context";
import { Logger } from "@/lib/logger";

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
}): FastifyInstance {
  const app = Fastify({
    logger: true,
    trustProxy: 1,

    genReqId: (req) =>
      (req.headers["x-request-id"] as string) ?? crypto.randomUUID(),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  if (!config.isProduction) {
    app.register(swagger, {
      openapi: {
        openapi: "3.0.3",
        info: {
          title: "Notification Preferences API",
          version: "1.0.0",
        },
      },
      transform: jsonSchemaTransform,
    });

    app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: { docExpansion: "list" },
    });

    // app.swagger() is only available after the swagger plugin initializes
    app.after(() => {
      app.get("/openapi.json", { schema: { hide: true } }, (_req, rep) => {
        return rep.send(withNamedOperationSchemas(app.swagger()));
      });
    });
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

  app.setErrorHandler((err, _req, rep) => {
    if (err instanceof ConflictError) {
      return rep.status(409).send({ message: err.message, ...err.meta });
    }
    if (err instanceof NotFoundError) {
      return rep.status(404).send({ message: err.message });
    }
    if (err instanceof ForbiddenError) {
      return rep.status(403).send({ message: err.message, ...err.meta });
    }
    if (err instanceof TooManyRequestsError) {
      return rep.status(429).send({ message: err.message, ...err.meta });
    }
    if (err instanceof UnprocessableError) {
      return rep.status(422).send({ message: err.message });
    }
    if (err instanceof UnauthorizedError) {
      return rep.status(401).send({ message: err.message });
    }
    if (err instanceof DomainError) {
      return rep.status(400).send({ message: err.message });
    }
    return rep
      .status((err as any).statusCode || 500)
      .send({ message: (err as any).message });
  });

  registerRoutes({ app, useCases, logger });

  return app;
}
