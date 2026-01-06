import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import {
	assignFeatureBodySchema,
	assignFeatureParamsSchema,
	assignFeatureResponseSchema,
} from './schema'

export const assignFeatureController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).post(
		'/tenants/:tenantId/plans/:planId/features',
		async ({ params, body }) => {
			await container.plans.assignFeature.execute({
				planId: params.planId,
				tenantId: params.tenantId,
				featureId: body.featureId,
				value: body.value,
			})
			return {
				success: true,
				message: 'Feature atribuída ao plano com sucesso',
			}
		},
		{
			params: assignFeatureParamsSchema,
			body: assignFeatureBodySchema,
			response: {
				200: assignFeatureResponseSchema,
			},
		},
	),
)
