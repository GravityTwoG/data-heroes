import { parseConfig } from "@/config";

import { createApp } from "./app";

const bootstrap = async () => {
  const config = parseConfig();

  const httpServer = await createApp({
    config,
  });

  httpServer.listen({
    port: config.port,
    host: "0.0.0.0",
  });
};

bootstrap();
