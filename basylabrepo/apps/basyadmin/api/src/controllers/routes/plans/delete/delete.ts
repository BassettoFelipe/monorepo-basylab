import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { deletePlanParamsSchema, deletePlanResponseSchema } from './schema'

export const deletePlanController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).delete(
		'/tenants/:tenantId/plans/:planId',
		async ({ params }) => {
			await container.plans.delete.execute({
				planId: params.planId,
				tenantId: params.tenantId,
			})
			return {
				success: true,
				message: 'Plano deletado com sucesso',
			}
		},
		{
			params: deletePlanParamsSchema,
			response: {
				200: deletePlanResponseSchema,
			},
		},
	),
)
