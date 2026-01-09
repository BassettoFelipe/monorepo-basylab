export class HttpError extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode: number,
		public readonly type: string,
		public readonly metadata?: Record<string, unknown>,
	) {
		super(message)
		this.name = 'HttpError'
	}

	toJSON() {
		return {
			type: this.type,
			message: this.message,
			code: this.statusCode,
			...(this.metadata && { metadata: this.metadata }),
		}
	}
}

export class BadRequestError extends HttpError {
	constructor(message: string, type = 'BAD_REQUEST') {
		super(message, 400, type)
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = 'Não autorizado', type = 'UNAUTHORIZED') {
		super(message, 401, type)
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = 'Acesso negado', type = 'FORBIDDEN') {
		super(message, 403, type)
	}
}

export class NotFoundError extends HttpError {
	constructor(message = 'Recurso não encontrado', type = 'NOT_FOUND') {
		super(message, 404, type)
	}
}

export class ConflictError extends HttpError {
	constructor(message: string, type = 'CONFLICT') {
		super(message, 409, type)
	}
}

export class UnprocessableEntityError extends HttpError {
	constructor(message: string, type = 'UNPROCESSABLE_ENTITY') {
		super(message, 422, type)
	}
}

export class TooManyRequestsError extends HttpError {
	constructor(message = 'Muitas requisições', metadata?: Record<string, unknown>) {
		super(message, 429, 'TOO_MANY_REQUESTS', metadata)
	}
}

export class InternalServerError extends HttpError {
	constructor(
		message = 'Erro interno do servidor',
		type = 'INTERNAL_SERVER_ERROR',
		metadata?: Record<string, unknown>,
	) {
		super(message, 500, type, metadata)
	}
}
