import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { removeTenantParamsSchema, removeTenantResponseSchema } from './schema'

export const removeTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).delete(
		'/managers/:id/tenants/:tenantId',
		async ({ params }) => {
			await container.managers.removeTenant.execute({
				managerId: params.id,
				tenantId: params.tenantId,
			})
			return {
				success: true,
				message: 'Tenant removido do manager com sucesso',
			}
		},
		{
			params: removeTenantParamsSchema,
			response: {
				200: removeTenantResponseSchema,
			},
		},
	),
)
