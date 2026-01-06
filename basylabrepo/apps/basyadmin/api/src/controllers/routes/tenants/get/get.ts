import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { getTenantParamsSchema, getTenantResponseSchema } from './schema'

export const getTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/tenants/:tenantId',
		async ({ params, user }) => {
			const result = await container.tenants.get.execute({
				tenantId: params.tenantId,
				userRole: user.role,
				userId: user.userId,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			params: getTenantParamsSchema,
			response: {
				200: getTenantResponseSchema,
			},
		},
	),
)
