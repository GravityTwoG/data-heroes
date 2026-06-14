import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "@fastify/type-provider-zod";
import { withNamedOperationSchemas } from "./openapi-components";
import type { FastifyApp } from "../types";

export function registerSwagger(app: FastifyApp) {
  app.addHook("onListen", async function () {
    const { port } = app.server.address() as { port: number };
    app.log.info(`Swagger docs: http://127.0.0.1:${port}/docs`);
  });

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
