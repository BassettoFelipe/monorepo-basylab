import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { getManagerParamsSchema, getManagerResponseSchema } from './schema'

export const getManagerController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).get(
		'/managers/:id',
		async ({ params }) => {
			const result = await container.managers.get.execute({
				managerId: params.id,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			params: getManagerParamsSchema,
			response: {
				200: getManagerResponseSchema,
			},
		},
	),
)
