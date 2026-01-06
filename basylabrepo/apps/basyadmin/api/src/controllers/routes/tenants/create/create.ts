import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { createTenantBodySchema, createTenantResponseSchema } from './schema'

export const createTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).post(
		'/tenants',
		async ({ body }) => {
			const result = await container.tenants.create.execute(body)
			return {
				success: true,
				message: 'Tenant criado com sucesso',
				data: result,
			}
		},
		{
			body: createTenantBodySchema,
			response: {
				200: createTenantResponseSchema,
			},
		},
	),
)
