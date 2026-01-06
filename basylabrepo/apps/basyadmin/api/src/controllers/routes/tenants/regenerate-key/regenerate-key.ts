import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { regenerateKeyParamsSchema, regenerateKeyResponseSchema } from './schema'

export const regenerateKeyController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).post(
		'/tenants/:tenantId/regenerate-key',
		async ({ params }) => {
			const result = await container.tenants.regenerateApiKey.execute({
				tenantId: params.tenantId,
			})
			return {
				success: true,
				message: 'API Key regenerada com sucesso',
				apiKey: result.apiKey,
			}
		},
		{
			params: regenerateKeyParamsSchema,
			response: {
				200: regenerateKeyResponseSchema,
			},
		},
	),
)
