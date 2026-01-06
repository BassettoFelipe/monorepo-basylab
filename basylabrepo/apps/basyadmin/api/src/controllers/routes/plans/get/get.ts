import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { getPlanParamsSchema, getPlanResponseSchema } from './schema'

export const getPlanController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/tenants/:tenantId/plans/:planId',
		async ({ params }) => {
			const result = await container.plans.get.execute({
				planId: params.planId,
				tenantId: params.tenantId,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			params: getPlanParamsSchema,
			response: {
				200: getPlanResponseSchema,
			},
		},
	),
)
