import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import {
	updateManagerBodySchema,
	updateManagerParamsSchema,
	updateManagerResponseSchema,
} from './schema'

export const updateManagerController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).put(
		'/managers/:id',
		async ({ params, body }) => {
			const result = await container.managers.update.execute({
				managerId: params.id,
				...body,
			})
			return {
				success: true,
				message: 'Manager atualizado com sucesso',
				data: result,
			}
		},
		{
			params: updateManagerParamsSchema,
			body: updateManagerBodySchema,
			response: {
				200: updateManagerResponseSchema,
			},
		},
	),
)
