import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { listManagersResponseSchema } from './schema'

export const listManagersController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).get(
		'/managers',
		async () => {
			const result = await container.managers.list.execute()
			return {
				success: true,
				data: result,
			}
		},
		{
			response: {
				200: listManagersResponseSchema,
			},
		},
	),
)
