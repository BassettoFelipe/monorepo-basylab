import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { aggregateEventsQuerySchema, aggregateEventsResponseSchema } from './schema'

export const aggregateEventsAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/events/aggregate',
		async ({ query, user }) => {
			const result = await container.events.aggregate.execute({
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
			query: aggregateEventsQuerySchema,
			response: {
				200: aggregateEventsResponseSchema,
			},
		},
	),
)
