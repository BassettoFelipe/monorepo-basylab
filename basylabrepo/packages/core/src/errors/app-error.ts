/**
 * Base Application Error
 *
 * Provides a consistent error structure across the application
 * with HTTP status codes and optional error codes for client handling
 */
export class AppError extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode: number = 400,
		public readonly code?: string,
		public readonly metadata?: Record<string, unknown>,
	) {
		super(message)
		this.name = 'AppError'
		Error.captureStackTrace(this, this.constructor)
	}

	/**
	 * Convert error to JSON for API responses
	 */
	toJSON() {
		return {
			error: this.message,
			code: this.code,
			statusCode: this.statusCode,
			...(this.metadata && { metadata: this.metadata }),
		}
	}
}
