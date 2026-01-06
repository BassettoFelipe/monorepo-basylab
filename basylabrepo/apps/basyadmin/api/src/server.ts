import { createLogger } from '@basylab/core/logger'
import cors from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { env } from './config'
import {
	authRoutes,
	billingAdminRoutes,
	billingApiRoutes,
	eventAdminRoutes,
	eventApiRoutes,
	featureRoutes,
	managerRoutes,
	planRoutes,
	tenantRoutes,
	ticketAdminRoutes,
	ticketApiRoutes,
} from './controllers/routes'

const logger = createLogger({
	service: 'basyadmin-api',
	level: env.isDev ? 'debug' : 'info',
})

const app = new Elysia()
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			credentials: true,
		}),
	)
	.use(
		swagger({
			path: '/docs',
			documentation: {
				info: {
					title: 'Basyadmin API',
					version: '1.0.0',
					description: 'API do painel administrativo centralizado',
				},
				tags: [
					{ name: 'Auth', description: 'Autenticação' },
					{ name: 'Tenants', description: 'Gestão de tenants' },
					{ name: 'Managers', description: 'Gestão de managers' },
					{ name: 'Features', description: 'Catálogo de features' },
					{ name: 'Plans', description: 'Planos por tenant' },
					{ name: 'Tickets', description: 'Sistema de tickets' },
					{ name: 'Events', description: 'Tracking de eventos' },
					{ name: 'Billing', description: 'Faturamento' },
				],
			},
		}),
	)
	.onError(({ error, code, set }) => {
		if ('statusCode' in error && typeof error.statusCode === 'number') {
			set.status = error.statusCode
			const err = error as Error & { statusCode: number }
			return {
				error: err.name,
				message: err.message,
				statusCode: err.statusCode,
			}
		}

		if (code === 'VALIDATION') {
			set.status = 400
			return {
				error: 'ValidationError',
				message: String(error),
				statusCode: 400,
			}
		}

		logger.error({ err: error }, 'Unhandled error')

		set.status = 500
		return {
			error: 'InternalServerError',
			message: 'Erro interno do servidor',
			statusCode: 500,
		}
	})
	.get('/health', () => ({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
	}))
	// Auth routes
	.use(authRoutes)
	// Admin routes (require auth)
	.use(tenantRoutes)
	.use(managerRoutes)
	.use(featureRoutes)
	.use(planRoutes)
	.use(ticketAdminRoutes)
	.use(eventAdminRoutes)
	.use(billingAdminRoutes)
	// API routes (require API key)
	.use(ticketApiRoutes)
	.use(eventApiRoutes)
	.use(billingApiRoutes)
	.listen(env.PORT)

logger.info(
	{
		port: env.PORT,
		environment: env.NODE_ENV,
	},
	`Basyadmin API running on http://localhost:${env.PORT}`,
)

export type App = typeof app
