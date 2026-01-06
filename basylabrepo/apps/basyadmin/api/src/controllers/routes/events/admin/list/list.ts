import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { listEventsQuerySchema, listEventsResponseSchema } from './schema'

export const listEventsAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/events',
		async ({ query, user }) => {
			const result = await container.events.list.execute({
				userRole: user.role,
				userId: user.userId,
				tenantId: query.tenantId,
				eventName: query.eventName,
				eventUserId: query.userId,
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
			query: listEventsQuerySchema,
			response: {
				200: listEventsResponseSchema,
			},
		},
	),
)
