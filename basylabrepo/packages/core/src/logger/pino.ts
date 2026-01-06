import pino, { type Logger, type LoggerOptions } from 'pino'

export interface CreateLoggerOptions {
	/**
	 * Service name for identification
	 */
	service: string
	/**
	 * Environment (development, production, test)
	 */
	env?: string
	/**
	 * Log level (trace, debug, info, warn, error, fatal)
	 */
	level?: string
	/**
	 * Service version
	 */
	version?: string
	/**
	 * Use pretty printing (for development)
	 */
	pretty?: boolean
}

/**
 * Create a configured Pino logger instance
 */
export function createLogger(options: CreateLoggerOptions): Logger {
	const {
		service,
		env = process.env.NODE_ENV || 'development',
		level = process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
		version = '1.0.0',
		pretty = env === 'development',
	} = options

	const baseOptions: LoggerOptions = {
		level,
		base: {
			service,
			env,
			version,
		},
		timestamp: pino.stdTimeFunctions.isoTime,
		formatters: {
			level: (label) => ({ level: label.toUpperCase() }),
		},
	}

	if (pretty) {
		return pino({
			...baseOptions,
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'SYS:standard',
					ignore: 'pid,hostname',
				},
			},
		})
	}

	return pino(baseOptions)
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(parent: Logger, bindings: Record<string, unknown>): Logger {
	return parent.child(bindings)
}

export type { Logger }
