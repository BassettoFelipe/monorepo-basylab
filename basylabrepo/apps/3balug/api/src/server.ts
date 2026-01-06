import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { jobs } from '@/container'
import { confirmEmailController } from '@/controllers/routes/auth/confirm-email/confirm-email'
import { confirmPasswordResetController } from '@/controllers/routes/auth/confirm-password-reset/confirm-password-reset'
import { loginController } from '@/controllers/routes/auth/login/login'
import { logoutController } from '@/controllers/routes/auth/logout/logout'
import { meController } from '@/controllers/routes/auth/me/me'
import { passwordResetStatusController } from '@/controllers/routes/auth/password-reset-status/password-reset-status'
import { refreshController } from '@/controllers/routes/auth/refresh/refresh'
import { registerController } from '@/controllers/routes/auth/register/register'
import { resendPasswordResetCodeController } from '@/controllers/routes/auth/resend-password-reset-code/resend-password-reset-code'
import { resendStatusController } from '@/controllers/routes/auth/resend-status/resend-status'
import { resendVerificationCodeController } from '@/controllers/routes/auth/resend-verification-code/resend-verification-code'
import { validateEmailForResetController } from '@/controllers/routes/auth/validate-email-for-reset/validate-email-for-reset'
import { avatarController } from '@/controllers/routes/avatar'
import { companiesRoutes } from '@/controllers/routes/companies'
import { contractsRoutes } from '@/controllers/routes/contracts'
import { customFieldsController } from '@/controllers/routes/custom-fields'
import { dashboardRoutes } from '@/controllers/routes/dashboard'
import { documentsController } from '@/controllers/routes/documents'
import { filesController } from '@/controllers/routes/files'
import { createPendingPaymentController } from '@/controllers/routes/payment/create-pending-payment/create-pending-payment'
import { getPendingPaymentController } from '@/controllers/routes/payment/get-pending-payment/get-pending-payment'
import { processCardPaymentController } from '@/controllers/routes/payment/process-card-payment/process-card-payment'
import { getPlanController } from '@/controllers/routes/plans/get/get'
import { listPlansController } from '@/controllers/routes/plans/list/list'
import { propertiesRoutes } from '@/controllers/routes/properties'
import { propertyOwnersRoutes } from '@/controllers/routes/property-owners'
import { activateSubscriptionController } from '@/controllers/routes/subscriptions/activate/activate'
import { changePlanController } from '@/controllers/routes/subscriptions/change-plan/change-plan'
import { checkoutInfoController } from '@/controllers/routes/subscriptions/checkout-info/checkout-info'
import { tenantsRoutes } from '@/controllers/routes/tenants'
import { usersRoutes } from '@/controllers/routes/users'
import { pagarmeWebhookController } from '@/controllers/routes/webhooks/pagarme/pagarme'
import { jobScheduler } from '@/jobs/scheduler'
import { devDelayPlugin } from '@/plugins/dev-delay.plugin'
import { errorHandlerPlugin } from '@/plugins/error-handler.plugin'
import { healthCheckPlugin } from '@/plugins/health-check.plugin'
import { metricsPlugin } from '@/plugins/metrics.plugin'
import { observabilityPlugin } from '@/plugins/observability.plugin'
import { securityHeadersPlugin } from '@/plugins/security-headers.plugin'

logger.info({
	msg: 'Starting 3Balug API',
	environment: env.NODE_ENV,
	port: env.PORT,
})

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
					title: '3Balug API',
					version: '1.0.0',
					description: 'CRM Imobiliário - Sistema de gestão de imóveis, contratos e locações',
				},
				tags: [
					{ name: 'Auth', description: 'Autenticação e autorização' },
					{ name: 'Users', description: 'Gestão de usuários' },
					{ name: 'Properties', description: 'Gestão de imóveis' },
					{ name: 'Property Owners', description: 'Proprietários de imóveis' },
					{ name: 'Tenants', description: 'Locatários' },
					{ name: 'Contracts', description: 'Contratos de locação' },
					{ name: 'Custom Fields', description: 'Campos customizados' },
					{ name: 'Files', description: 'Upload e gestão de arquivos' },
					{ name: 'Dashboard', description: 'Estatísticas e métricas' },
					{ name: 'Plans', description: 'Planos de assinatura' },
					{ name: 'Payment', description: 'Pagamentos e cobrança' },
				],
			},
		}),
	)
	.use(metricsPlugin())
	.use(observabilityPlugin)
	.use(securityHeadersPlugin())
	.use(devDelayPlugin())
	.use(errorHandlerPlugin)
	.use(healthCheckPlugin())
	.get('/', () => ({
		message: '3Balug API',
		version: '1.0.0',
		status: 'running',
	}))
	.use(registerController)
	.use(confirmEmailController)
	.use(resendVerificationCodeController)
	.use(resendStatusController)
	.use(loginController)
	.use(refreshController)
	.use(logoutController)
	.use(meController)
	.use(validateEmailForResetController)
	.use(passwordResetStatusController)
	.use(resendPasswordResetCodeController)
	.use(confirmPasswordResetController)
	.use(listPlansController)
	.use(getPlanController)
	.use(createPendingPaymentController)
	.use(getPendingPaymentController)
	.use(processCardPaymentController)
	.use(checkoutInfoController)
	.use(activateSubscriptionController)
	.use(changePlanController)
	.use(pagarmeWebhookController)
	.use(companiesRoutes)
	.use(customFieldsController)
	.use(usersRoutes)
	.use(propertyOwnersRoutes)
	.use(tenantsRoutes)
	.use(propertiesRoutes)
	.use(contractsRoutes)
	.use(dashboardRoutes)
	.use(avatarController)
	.use(filesController)
	.use(documentsController)

if (env.NODE_ENV !== 'test') {
	app.listen({ port: env.PORT, hostname: '0.0.0.0' })

	logger.info({
		msg: 'Server is running',
		port: env.PORT,
		url: `http://localhost:${env.PORT}`,
	})

	jobScheduler.register(
		'cleanup-expired-payments',
		() => jobs.cleanupExpiredPayments.execute(),
		6 * 60 * 60 * 1000,
	)
	jobScheduler.start()

	logger.info('Job scheduler started')

	// Graceful shutdown handlers
	const gracefulShutdown = async (signal: string) => {
		logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...')

		try {
			// Stop accepting new connections
			app.stop()
			logger.info('Server stopped accepting new connections')

			// Stop job scheduler
			jobScheduler.stop()
			logger.info('Job scheduler stopped')

			// Close Redis connection
			const { closeRedis } = await import('@/config/redis')
			await closeRedis()
			logger.info('Redis connection closed')

			// Close database connection pool
			const { closeDatabase } = await import('@/db')
			await closeDatabase()
			logger.info('Database connection closed')

			logger.info('Graceful shutdown completed')
			process.exit(0)
		} catch (error) {
			logger.error({ error }, 'Error during graceful shutdown')
			process.exit(1)
		}
	}

	process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
	process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}

export { app }
export type App = typeof app
