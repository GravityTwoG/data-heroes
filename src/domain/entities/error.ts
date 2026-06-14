export class DomainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DomainError";
  }
}

export class ConflictError extends DomainError {
  constructor(
    message: string,
    readonly meta?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(
    message: string,
    readonly meta?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ForbiddenError";
  }
}

export class UnprocessableError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UnprocessableError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UnauthorizedError";
  }
}

export class TooManyRequestsError extends DomainError {
  constructor(
    message: string,
    readonly meta?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "TooManyRequestsError";
  }
}
