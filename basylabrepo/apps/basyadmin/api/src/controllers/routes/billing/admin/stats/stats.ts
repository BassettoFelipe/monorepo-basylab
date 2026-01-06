import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { billingStatsQuerySchema, billingStatsResponseSchema } from './schema'

export const billingStatsAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/billing/stats',
		async ({ query, user }) => {
			const result = await container.billing.getStats.execute({
				userRole: user.role,
				userId: user.userId,
				tenantId: query.tenantId,
				startDate: query.startDate ? new Date(query.startDate) : undefined,
				endDate: query.endDate ? new Date(query.endDate) : undefined,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			query: billingStatsQuerySchema,
			response: {
				200: billingStatsResponseSchema,
			},
		},
	),
)
