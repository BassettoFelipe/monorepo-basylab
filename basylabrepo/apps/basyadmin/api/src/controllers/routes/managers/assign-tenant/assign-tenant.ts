import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import {
	assignTenantBodySchema,
	assignTenantParamsSchema,
	assignTenantResponseSchema,
} from './schema'

export const assignTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).post(
		'/managers/:id/tenants',
		async ({ params, body }) => {
			await container.managers.assignTenant.execute({
				managerId: params.id,
				tenantId: body.tenantId,
			})
			return {
				success: true,
				message: 'Tenant atribuído ao manager com sucesso',
			}
		},
		{
			params: assignTenantParamsSchema,
			body: assignTenantBodySchema,
			response: {
				200: assignTenantResponseSchema,
			},
		},
	),
)
