import { Value } from '@sinclair/typebox/value'
import { t } from 'elysia'

const envSchema = t.Object({
	NODE_ENV: t.Union([t.Literal('development'), t.Literal('production'), t.Literal('test')]),
	PORT: t.Number({ minimum: 1, maximum: 65535 }),

	POSTGRES_USER: t.String({ minLength: 1 }),
	POSTGRES_PASSWORD: t.String({ minLength: 1 }),
	POSTGRES_DB: t.String({ minLength: 1 }),
	POSTGRES_HOST: t.String({ minLength: 1 }),
	POSTGRES_PORT: t.Number({ minimum: 1, maximum: 65535 }),

	DATABASE_URL: t.String({ minLength: 1 }),
	TEST_DATABASE_URL: t.String({ minLength: 1 }),

	JWT_ACCESS_SECRET: t.String({ minLength: 32 }),
	JWT_REFRESH_SECRET: t.String({ minLength: 32 }),
	JWT_RESET_PASSWORD_SECRET: t.String({ minLength: 32 }),
	JWT_CHECKOUT_SECRET: t.String({ minLength: 32 }),
	JWT_ACCESS_EXPIRES_IN: t.String({ minLength: 1 }),
	JWT_REFRESH_EXPIRES_IN: t.String({ minLength: 1 }),
	JWT_RESET_PASSWORD_EXPIRES_IN: t.String({ minLength: 1 }),
	JWT_CHECKOUT_EXPIRES_IN: t.String({ minLength: 1 }),

	CORS_ORIGIN: t.String({ minLength: 1 }),
	FRONTEND_URL: t.String({ minLength: 1 }),

	PAGARME_ACCOUNT_ID: t.String({ minLength: 1 }),
	PAGARME_API_KEY: t.String({ minLength: 1 }),
	PAGARME_PUBLIC_KEY: t.String({ minLength: 1 }),

	SMTP_HOST: t.String({ minLength: 1 }),
	SMTP_PORT: t.Number({ minimum: 1, maximum: 65535 }),
	SMTP_SECURE: t.Boolean(),
	SMTP_USER: t.String({ minLength: 1 }),
	SMTP_PASS: t.String({ minLength: 1 }),
	EMAIL_FROM: t.String({ minLength: 1 }),

	TOTP_SECRET: t.String({ minLength: 32 }),
	TOTP_DIGITS: t.Number({ minimum: 6, maximum: 8 }),
	TOTP_STEP_SECONDS: t.Number({ minimum: 30 }),

	REDIS_HOST: t.Optional(t.String({ minLength: 1 })),
	REDIS_PORT: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
	REDIS_PASSWORD: t.Optional(t.String()),
	REDIS_DB: t.Optional(t.Number({ minimum: 0, maximum: 15 })),
	REDIS_CACHE_TTL: t.Optional(t.Number({ minimum: 1 })),
	REDIS_URL: t.Optional(t.String({ minLength: 1 })),

	MINIO_ENDPOINT: t.Optional(t.String({ minLength: 1 })),
	MINIO_PORT: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
	MINIO_ACCESS_KEY: t.Optional(t.String({ minLength: 1 })),
	MINIO_SECRET_KEY: t.Optional(t.String({ minLength: 1 })),
	MINIO_BUCKET: t.Optional(t.String({ minLength: 1 })),
	MINIO_USE_SSL: t.Optional(t.Boolean()),
	MINIO_PUBLIC_URL: t.Optional(t.String({ minLength: 1 })),
})

type EnvConfig = {
	NODE_ENV: 'development' | 'production' | 'test'
	PORT: number
	POSTGRES_USER: string
	POSTGRES_PASSWORD: string
	POSTGRES_DB: string
	POSTGRES_HOST: string
	POSTGRES_PORT: number
	DATABASE_URL: string
	TEST_DATABASE_URL: string
	JWT_ACCESS_SECRET: string
	JWT_REFRESH_SECRET: string
	JWT_RESET_PASSWORD_SECRET: string
	JWT_CHECKOUT_SECRET: string
	JWT_ACCESS_EXPIRES_IN: string
	JWT_REFRESH_EXPIRES_IN: string
	JWT_RESET_PASSWORD_EXPIRES_IN: string
	JWT_CHECKOUT_EXPIRES_IN: string
	CORS_ORIGIN: string
	FRONTEND_URL: string
	PAGARME_ACCOUNT_ID: string
	PAGARME_API_KEY: string
	PAGARME_PUBLIC_KEY: string
	SMTP_HOST: string
	SMTP_PORT: number
	SMTP_SECURE: boolean
	SMTP_USER: string
	SMTP_PASS: string
	EMAIL_FROM: string
	TOTP_SECRET: string
	TOTP_DIGITS: number
	TOTP_STEP_SECONDS: number
	REDIS_HOST: string
	REDIS_PORT: number
	REDIS_PASSWORD?: string
	REDIS_DB: number
	REDIS_CACHE_TTL: number
	REDIS_URL?: string
	MINIO_ENDPOINT: string
	MINIO_PORT: number
	MINIO_ACCESS_KEY: string
	MINIO_SECRET_KEY: string
	MINIO_BUCKET: string
	MINIO_USE_SSL: boolean
	MINIO_PUBLIC_URL?: string
}

function parseEnv(): EnvConfig {
	const resolvedNodeEnv =
		process.env.BUN_TESTING === '1' ? 'test' : process.env.NODE_ENV || 'development'

	const rawEnv = {
		NODE_ENV: resolvedNodeEnv,
		PORT: Number(process.env.PORT || (resolvedNodeEnv === 'test' ? 3001 : undefined)),
		POSTGRES_USER: process.env.POSTGRES_USER,
		POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
		POSTGRES_DB: process.env.POSTGRES_DB,
		POSTGRES_HOST: process.env.POSTGRES_HOST,
		POSTGRES_PORT: Number(process.env.POSTGRES_PORT),
		DATABASE_URL: process.env.DATABASE_URL,
		TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
		JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
		JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
		JWT_RESET_PASSWORD_SECRET: process.env.JWT_RESET_PASSWORD_SECRET,
		JWT_CHECKOUT_SECRET: process.env.JWT_CHECKOUT_SECRET || process.env.JWT_ACCESS_SECRET,
		JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
		JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
		JWT_RESET_PASSWORD_EXPIRES_IN: process.env.JWT_RESET_PASSWORD_EXPIRES_IN,
		JWT_CHECKOUT_EXPIRES_IN: process.env.JWT_CHECKOUT_EXPIRES_IN || '30m',
		CORS_ORIGIN: process.env.CORS_ORIGIN,
		FRONTEND_URL: process.env.FRONTEND_URL,
		PAGARME_ACCOUNT_ID: process.env.PAGARME_ACCOUNT_ID,
		PAGARME_API_KEY: process.env.PAGARME_API_KEY,
		PAGARME_PUBLIC_KEY: process.env.PAGARME_PUBLIC_KEY,
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: Number(process.env.SMTP_PORT),
		SMTP_SECURE: process.env.SMTP_SECURE === 'true',
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASS: process.env.SMTP_PASS,
		EMAIL_FROM: process.env.EMAIL_FROM,
		TOTP_SECRET: process.env.TOTP_SECRET,
		TOTP_DIGITS: Number(process.env.TOTP_DIGITS),
		TOTP_STEP_SECONDS: Number(process.env.TOTP_STEP_SECONDS),
		REDIS_HOST: process.env.REDIS_HOST || 'localhost',
		REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
		REDIS_PASSWORD: process.env.REDIS_PASSWORD,
		REDIS_DB: Number(process.env.REDIS_DB || 0),
		REDIS_CACHE_TTL: Number(process.env.REDIS_CACHE_TTL || 300),
		REDIS_URL: process.env.REDIS_URL,
		MINIO_ENDPOINT:
			process.env.MINIO_ENDPOINT || (resolvedNodeEnv === 'development' ? 'localhost' : undefined),
		MINIO_PORT: Number(
			process.env.MINIO_PORT || (resolvedNodeEnv === 'development' ? 9000 : undefined),
		),
		MINIO_ACCESS_KEY:
			process.env.MINIO_ACCESS_KEY ||
			(resolvedNodeEnv === 'development' ? 'minioadmin' : undefined),
		MINIO_SECRET_KEY:
			process.env.MINIO_SECRET_KEY ||
			(resolvedNodeEnv === 'development' ? 'minioadmin123' : undefined),
		MINIO_BUCKET:
			process.env.MINIO_BUCKET || (resolvedNodeEnv === 'development' ? '3balug' : undefined),
		MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
		MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL,
	}

	if (rawEnv.REDIS_URL) {
		try {
			const parsed = new URL(rawEnv.REDIS_URL)
			rawEnv.REDIS_HOST = parsed.hostname || rawEnv.REDIS_HOST
			rawEnv.REDIS_PORT = parsed.port ? Number(parsed.port) : rawEnv.REDIS_PORT
			rawEnv.REDIS_PASSWORD = parsed.password || rawEnv.REDIS_PASSWORD

			if (parsed.pathname && parsed.pathname !== '/') {
				const dbValue = Number(parsed.pathname.slice(1))
				if (!Number.isNaN(dbValue)) {
					rawEnv.REDIS_DB = dbValue
				}
			}
		} catch (error) {
			throw new Error(`Invalid REDIS_URL: ${error instanceof Error ? error.message : error}`)
		}
	}

	const errors = [...Value.Errors(envSchema, rawEnv)]

	if (errors.length > 0) {
		const missingVars = errors
			.map((error) => `  - ${error.path.slice(1)}: ${error.message}`)
			.join('\n')

		throw new Error(
			`Environment validation failed:\n\n${missingVars}\n\nPlease check your .env file.`,
		)
	}

	return rawEnv as EnvConfig
}

export const env = parseEnv()
