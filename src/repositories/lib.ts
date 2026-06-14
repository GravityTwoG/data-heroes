import {
  ConflictError,
  DomainError,
  NotFoundError,
  UnprocessableError,
} from "@/domain/entities/error";

import { Prisma } from "@/generated/prisma/client";

// Prisma error reference: https://www.prisma.io/docs/orm/reference/error-reference
function toDomainError(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = err.meta?.["target"];
        return new ConflictError(
          "Record already exists",
          { target },
          { cause: err },
        );
      }
      // Record to update/delete does not exist
      case "P2025":
        return new NotFoundError("Record not found", { cause: err });
      case "P2003":
        return new ConflictError(
          "Operation violates a relation constraint",
          undefined,
          {
            cause: err,
          },
        );
      case "P2014":
        return new ConflictError(
          "Operation violates a required relation",
          undefined,
          {
            cause: err,
          },
        );
      case "P2034":
        return new ConflictError("Write conflict, please retry", undefined, {
          cause: err,
        });
      case "P2000":
      case "P2011":
      case "P2012":
        return new UnprocessableError("Invalid data for this operation", {
          cause: err,
        });
      default:
        return new DomainError("Unknown prisma error", { cause: err });
    }
  }

  return new DomainError("Unknown error", { cause: err });
}

// Wraps a repository method so its errors are mapped to domain errors at the boundary.
export function prismaQuery<R extends (...args: any[]) => Promise<any>>(
  run: R,
): R {
  return (async (...args) => {
    try {
      return await run(...args);
    } catch (err) {
      throw toDomainError(err);
    }
  }) as R;
}
