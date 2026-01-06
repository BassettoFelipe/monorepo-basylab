import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import {
	updateFeatureBodySchema,
	updateFeatureParamsSchema,
	updateFeatureResponseSchema,
} from './schema'

export const updateFeatureController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).put(
		'/features/:id',
		async ({ params, body }) => {
			const result = await container.features.update.execute({
				featureId: params.id,
				...body,
			})
			return {
				success: true,
				message: 'Feature atualizada com sucesso',
				data: result,
			}
		},
		{
			params: updateFeatureParamsSchema,
			body: updateFeatureBodySchema,
			response: {
				200: updateFeatureResponseSchema,
			},
		},
	),
)
