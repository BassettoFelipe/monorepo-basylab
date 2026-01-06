export class HttpError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly type: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "HttpError";
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      code: this.statusCode,
      ...(this.metadata && { metadata: this.metadata }),
    };
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, type = "BAD_REQUEST") {
    super(message, 400, type);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Não autorizado", type = "UNAUTHORIZED") {
    super(message, 401, type);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Acesso negado", type = "FORBIDDEN") {
    super(message, 403, type);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Recurso não encontrado", type = "NOT_FOUND") {
    super(message, 404, type);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, type = "CONFLICT") {
    super(message, 409, type);
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string, type = "TOO_MANY_REQUESTS", metadata?: Record<string, unknown>) {
    super(message, 429, type, metadata);
    this.name = "TooManyRequestsError";
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string, type = "INTERNAL_SERVER_ERROR", metadata?: Record<string, unknown>) {
    super(message, 500, type, metadata);
    this.name = "InternalServerError";
  }
}
