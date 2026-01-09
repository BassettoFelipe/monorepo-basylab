import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { env } from '@/config/env'

console.log(`Starting Gradely API in ${env.NODE_ENV} mode...`)

const app = new Elysia()
	.use(
		env.NODE_ENV === 'development'
			? cors()
			: cors({
					origin: env.CORS_ORIGIN.includes(',')
						? env.CORS_ORIGIN.split(',').map((o) => o.trim())
						: env.CORS_ORIGIN,
					credentials: true,
				}),
	)
	.use(
		swagger({
			documentation: {
				info: {
					title: 'Gradely API',
					version: '0.1.0',
					description: 'Gradely - Sistema de gestão escolar',
				},
			},
		}),
	)
	.get('/', () => ({
		message: 'Gradely API',
		version: '0.1.0',
		status: 'running',
	}))
	.get('/health', () => ({
		status: 'healthy',
		timestamp: new Date().toISOString(),
	}))

if (env.NODE_ENV !== 'test') {
	app.listen({ port: env.PORT, hostname: '0.0.0.0' })

	console.log(`Server is running on http://localhost:${env.PORT}`)
	console.log(`Swagger docs available at http://localhost:${env.PORT}/swagger`)
}

export { app }
export type App = typeof app
