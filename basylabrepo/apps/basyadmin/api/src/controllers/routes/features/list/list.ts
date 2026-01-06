import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { listFeaturesQuerySchema, listFeaturesResponseSchema } from './schema'

export const listFeaturesController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/features',
		async ({ query }) => {
			const result = await container.features.list.execute({
				search: query.search,
				featureType: query.featureType,
				limit: query.limit ? Number(query.limit) : undefined,
				offset: query.offset ? Number(query.offset) : undefined,
			})
			return {
				success: true,
				...result,
			}
		},
		{
			query: listFeaturesQuerySchema,
			response: {
				200: listFeaturesResponseSchema,
			},
		},
	),
)
