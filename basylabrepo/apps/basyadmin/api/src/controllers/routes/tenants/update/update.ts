import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import {
	updateTenantBodySchema,
	updateTenantParamsSchema,
	updateTenantResponseSchema,
} from './schema'

export const updateTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).put(
		'/tenants/:tenantId',
		async ({ params, body }) => {
			const result = await container.tenants.update.execute({
				tenantId: params.tenantId,
				...body,
			})
			return {
				success: true,
				message: 'Tenant atualizado com sucesso',
				data: result,
			}
		},
		{
			params: updateTenantParamsSchema,
			body: updateTenantBodySchema,
			response: {
				200: updateTenantResponseSchema,
			},
		},
	),
)
