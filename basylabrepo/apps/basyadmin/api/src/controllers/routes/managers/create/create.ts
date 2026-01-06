import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { createManagerBodySchema, createManagerResponseSchema } from './schema'

export const createManagerController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).post(
		'/managers',
		async ({ body }) => {
			const result = await container.managers.create.execute(body)
			return {
				success: true,
				message: 'Manager criado com sucesso',
				data: result,
			}
		},
		{
			body: createManagerBodySchema,
			response: {
				200: createManagerResponseSchema,
			},
		},
	),
)
