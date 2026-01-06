import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { deleteFeatureParamsSchema, deleteFeatureResponseSchema } from './schema'

export const deleteFeatureController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).delete(
		'/features/:id',
		async ({ params }) => {
			await container.features.delete.execute({
				featureId: params.id,
			})
			return {
				success: true,
				message: 'Feature deletada com sucesso',
			}
		},
		{
			params: deleteFeatureParamsSchema,
			response: {
				200: deleteFeatureResponseSchema,
			},
		},
	),
)
