import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { createFeatureBodySchema, createFeatureResponseSchema } from './schema'

export const createFeatureController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).post(
		'/features',
		async ({ body }) => {
			const result = await container.features.create.execute(body)
			return {
				success: true,
				message: 'Feature criada com sucesso',
				data: result,
			}
		},
		{
			body: createFeatureBodySchema,
			response: {
				200: createFeatureResponseSchema,
			},
		},
	),
)
