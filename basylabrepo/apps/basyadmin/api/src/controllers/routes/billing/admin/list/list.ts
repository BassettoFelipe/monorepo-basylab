import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { listBillingQuerySchema, listBillingResponseSchema } from './schema'

export const listBillingAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/billing',
		async ({ query, user }) => {
			const result = await container.billing.list.execute({
				userRole: user.role,
				userId: user.userId,
				tenantId: query.tenantId,
				status: query.status as 'paid' | 'pending' | 'failed' | 'refunded' | undefined,
				startDate: query.startDate ? new Date(query.startDate) : undefined,
				endDate: query.endDate ? new Date(query.endDate) : undefined,
				limit: query.limit ? Number(query.limit) : undefined,
				offset: query.offset ? Number(query.offset) : undefined,
			})
			return {
				success: true,
				...result,
			}
		},
		{
			query: listBillingQuerySchema,
			response: {
				200: listBillingResponseSchema,
			},
		},
	),
)
