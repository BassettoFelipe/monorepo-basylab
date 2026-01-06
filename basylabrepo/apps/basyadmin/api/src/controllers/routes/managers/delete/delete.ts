import { Elysia } from 'elysia'
import { container } from '@/container'
import { ownerOnlyMiddleware } from '@/controllers/middlewares'
import { deleteManagerParamsSchema, deleteManagerResponseSchema } from './schema'

export const deleteManagerController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(ownerOnlyMiddleware).delete(
		'/managers/:id',
		async ({ params }) => {
			await container.managers.delete.execute({
				managerId: params.id,
			})
			return {
				success: true,
				message: 'Manager deletado com sucesso',
			}
		},
		{
			params: deleteManagerParamsSchema,
			response: {
				200: deleteManagerResponseSchema,
			},
		},
	),
)
