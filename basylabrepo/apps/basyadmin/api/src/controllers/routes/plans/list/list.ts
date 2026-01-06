import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { listPlansParamsSchema, listPlansResponseSchema } from './schema'

export const listPlansController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/tenants/:tenantId/plans',
		async ({ params }) => {
			const result = await container.plans.list.execute({
				tenantId: params.tenantId,
			})
			return {
				success: true,
				data: result.data,
			}
		},
		{
			params: listPlansParamsSchema,
			response: {
				200: listPlansResponseSchema,
			},
		},
	),
)
