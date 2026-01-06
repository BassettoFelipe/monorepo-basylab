import pino from 'pino'
import { env } from './env'

const isDevelopment = env.NODE_ENV === 'development'

const transport = isDevelopment
	? (() => {
			try {
				return pino.transport({
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'HH:MM:ss Z',
						ignore: 'pid,hostname',
					},
				})
			} catch {
				return undefined
			}
		})()
	: undefined

export const logger = pino(
	{
		level: isDevelopment ? 'debug' : 'info',

		formatters: {
			level: (label) => {
				return { level: label.toUpperCase() }
			},
		},

		base: {
			service: process.env.SERVICE_NAME || '3balug-api',
			env: env.NODE_ENV,
			version: process.env.APP_VERSION || '1.0.0',
		},

		timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
	},
	transport,
)
