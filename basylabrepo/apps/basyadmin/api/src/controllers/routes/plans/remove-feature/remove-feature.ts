import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { removeFeatureParamsSchema, removeFeatureResponseSchema } from './schema'

export const removeFeatureController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).delete(
		'/tenants/:tenantId/plans/:planId/features/:featureId',
		async ({ params }) => {
			await container.plans.removeFeature.execute({
				planId: params.planId,
				tenantId: params.tenantId,
				featureId: params.featureId,
			})
			return {
				success: true,
				message: 'Feature removida do plano com sucesso',
			}
		},
		{
			params: removeFeatureParamsSchema,
			response: {
				200: removeFeatureResponseSchema,
			},
		},
	),
)
