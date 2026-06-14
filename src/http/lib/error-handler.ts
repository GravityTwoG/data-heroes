import type { FastifyApp } from "../types";

import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableError,
} from "@/domain/entities/error";

export function registerErrorHandler(app: FastifyApp) {
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
}
