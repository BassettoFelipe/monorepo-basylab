import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { updatePlanBodySchema, updatePlanParamsSchema, updatePlanResponseSchema } from './schema'

export const updatePlanController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).put(
		'/tenants/:tenantId/plans/:planId',
		async ({ params, body }) => {
			const result = await container.plans.update.execute({
				planId: params.planId,
				tenantId: params.tenantId,
				...body,
			})
			return {
				success: true,
				message: 'Plano atualizado com sucesso',
				data: result,
			}
		},
		{
			params: updatePlanParamsSchema,
			body: updatePlanBodySchema,
			response: {
				200: updatePlanResponseSchema,
			},
		},
	),
)
