import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { createPlanBodySchema, createPlanParamsSchema, createPlanResponseSchema } from './schema'

export const createPlanController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).post(
		'/tenants/:tenantId/plans',
		async ({ params, body }) => {
			const result = await container.plans.create.execute({
				tenantId: params.tenantId,
				...body,
			})
			return {
				success: true,
				message: 'Plano criado com sucesso',
				data: result,
			}
		},
		{
			params: createPlanParamsSchema,
			body: createPlanBodySchema,
			response: {
				200: createPlanResponseSchema,
			},
		},
	),
)
