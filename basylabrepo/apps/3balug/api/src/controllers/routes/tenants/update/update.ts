import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import {
	updateTenantBodySchema,
	updateTenantParamsSchema,
	updateTenantResponseSchema,
} from './schema'

export const updateTenantController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.patch(
			'/tenants/:id',
			async ({ validatedUser, params, body }) => {
				const result = await container.tenants.update.execute({
					id: params.id,
					...body,
					updatedBy: validatedUser,
				})

				return {
					success: true,
					message: 'Locatário atualizado com sucesso',
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
