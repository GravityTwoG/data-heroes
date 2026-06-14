import type { IncomingMessage, Server, ServerResponse } from "node:http";

import type { FastifyInstance } from "fastify";

import type { Logger } from "@/lib/logger";

export type FastifyApp = FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse,
  Logger
>;
