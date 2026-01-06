import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { getFeatureParamsSchema, getFeatureResponseSchema } from './schema'

export const getFeatureController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/features/:id',
		async ({ params }) => {
			const result = await container.features.get.execute({
				featureId: params.id,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			params: getFeatureParamsSchema,
			response: {
				200: getFeatureResponseSchema,
			},
		},
	),
)
