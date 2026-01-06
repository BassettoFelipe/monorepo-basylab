import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { listTenantsQuerySchema, listTenantsResponseSchema } from './schema'

export const listTenantsController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/tenants',
		async ({ query, user }) => {
			const result = await container.tenants.list.execute({
				userRole: user.role,
				userId: user.userId,
				search: query.search,
				limit: query.limit ? Number(query.limit) : undefined,
				offset: query.offset ? Number(query.offset) : undefined,
			})
			return {
				success: true,
				...result,
			}
		},
		{
			query: listTenantsQuerySchema,
			response: {
				200: listTenantsResponseSchema,
			},
		},
	),
)
