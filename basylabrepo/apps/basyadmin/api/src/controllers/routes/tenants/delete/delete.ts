import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { deleteTenantParamsSchema, deleteTenantResponseSchema } from './schema'

export const deleteTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).delete(
		'/tenants/:tenantId',
		async ({ params }) => {
			await container.tenants.delete.execute({
				tenantId: params.tenantId,
			})
			return {
				success: true,
				message: 'Tenant deletado com sucesso',
			}
		},
		{
			params: deleteTenantParamsSchema,
			response: {
				200: deleteTenantResponseSchema,
			},
		},
	),
)
