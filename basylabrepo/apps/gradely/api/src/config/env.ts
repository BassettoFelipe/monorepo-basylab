import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const EnvSchema = Type.Object({
	NODE_ENV: Type.Union(
		[Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
		{
			default: 'development',
		},
	),
	PORT: Type.Number({ default: 3000 }),
	CORS_ORIGIN: Type.String({ default: 'http://localhost:5173' }),

	// Database
	DATABASE_URL: Type.String(),

	// JWT
	JWT_ACCESS_SECRET: Type.String(),
	JWT_ACCESS_EXPIRES_IN: Type.String({ default: '15m' }),
	JWT_REFRESH_SECRET: Type.String(),
	JWT_REFRESH_EXPIRES_IN: Type.String({ default: '7d' }),
})

function loadEnv() {
	const rawEnv = {
		NODE_ENV: process.env.NODE_ENV || 'development',
		PORT: Number(process.env.PORT) || 3000,
		CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
		DATABASE_URL: process.env.DATABASE_URL,
		JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
		JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
		JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
		JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
	}

	if (!Value.Check(EnvSchema, rawEnv)) {
		const errors = [...Value.Errors(EnvSchema, rawEnv)]
		const missingVars = errors.map((e) => `${e.path}: ${e.message}`).join('\n')
		throw new Error(`Missing or invalid environment variables:\n${missingVars}`)
	}

	return rawEnv as {
		NODE_ENV: 'development' | 'production' | 'test'
		PORT: number
		CORS_ORIGIN: string
		DATABASE_URL: string
		JWT_ACCESS_SECRET: string
		JWT_ACCESS_EXPIRES_IN: string
		JWT_REFRESH_SECRET: string
		JWT_REFRESH_EXPIRES_IN: string
	}
}

export const env = loadEnv()
