import type { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { recordHttpMetrics } from '@/plugins/metrics.plugin'

interface StoreWithObservability {
	startTime?: number
	requestId?: string
	metricsRecorded?: boolean
	user?: {
		id: string
		email: string
	}
}

interface ErrorWithStatus extends Error {
	status?: number
	statusCode?: number
}

export const observabilityPlugin = (app: Elysia) =>
	app
		.onRequest(({ store }: { store: Record<string, unknown> }) => {
			store.startTime = Date.now()
			store.requestId = crypto.randomUUID()
			store.metricsRecorded = false
		})
		.onAfterHandle(async ({ request, route, set, store }) => {
			const s = store as unknown as StoreWithObservability
			const responseTime = Date.now() - (s.startTime || Date.now())
			const url = new URL(request.url)
			const path = url.pathname
			const method = request.method
			const status = set.status || 200
			const routeLabel = typeof route === 'string' && route.length > 0 ? route : '__unmatched__'

			if (path !== '/metrics' && !s.metricsRecorded) {
				recordHttpMetrics({
					method,
					route: routeLabel,
					status: String(status),
					durationSeconds: responseTime / 1000,
				})
				s.metricsRecorded = true
			}

			const ip =
				request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
			const userAgent = request.headers.get('user-agent') || 'unknown'

			const userId = s.user?.id || null
			const userEmail = s.user?.email || null
			let action = null

			if (path.includes('/register')) {
				action = 'signup'
			} else if (path.includes('/login')) {
				action = 'login'
			} else if (path.includes('/logout')) {
				action = 'logout'
			} else if (path.includes('/password-reset') || path.includes('/validate-email-for-reset')) {
				action = 'password_reset'
			} else if (path.includes('/activate')) {
				action = 'activate_subscription'
			} else if (path.includes('/change-plan')) {
				action = 'change_plan'
			} else if (path.includes('/payment')) {
				action = 'payment'
			}

			logger.info({
				msg: 'Request completed',
				project: '3balug',
				method,
				route: routeLabel,
				path,
				status,
				responseTime,
				ip,
				userAgent,
				userId,
				userEmail,
				action,
				requestId: s.requestId,
			})
		})
		.onError({ as: 'global' }, async ({ error, code, request, route, store }) => {
			const s = store as unknown as StoreWithObservability
			const e = error as ErrorWithStatus
			const url = new URL(request.url)
			const path = url.pathname
			const status = Number(e?.status ?? e?.statusCode ?? 500)
			const routeLabel = typeof route === 'string' && route.length > 0 ? route : '__unmatched__'

			if (path !== '/metrics' && !s.metricsRecorded) {
				const responseTime = Date.now() - (s.startTime || Date.now())
				recordHttpMetrics({
					method: request.method,
					route: routeLabel,
					status: String(status),
					durationSeconds: responseTime / 1000,
				})
				s.metricsRecorded = true
			}

			const responseTime = Date.now() - (s.startTime || Date.now())
			const logData = {
				msg: 'Request error',
				error: e.message,
				code,
				method: request.method,
				path: url.pathname,
				route: routeLabel,
				status,
				responseTime,
				requestId: s.requestId,
			}

			if (status >= 500) {
				logger.error(logData)
			} else {
				logger.warn(logData)
			}
		})
