import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import {
	updatePropertyBodySchema,
	updatePropertyParamsSchema,
	updatePropertyResponseSchema,
} from './schema'

export const updatePropertyController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.patch(
			'/properties/:id',
			async ({ validatedUser, params, body }) => {
				const result = await container.properties.update.execute({
					id: params.id,
					...body,
					updatedBy: validatedUser,
				})

				return {
					success: true,
					message: 'Imóvel atualizado com sucesso',
					data: result,
				}
			},
			{
				params: updatePropertyParamsSchema,
				body: updatePropertyBodySchema,
				response: {
					200: updatePropertyResponseSchema,
				},
			},
		),
)
