import { Elysia, t } from 'elysia'
import { logger } from '@/config/logger'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'

export const deleteUserController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER]))
		.delete(
			'/users/:id/permanent',
			async ({ validatedUser, params }) => {
				const result = await container.users.deleteUser.execute({
					userId: params.id,
					deletedBy: validatedUser,
				})

				logger.info(
					{
						event: 'USER_DELETED_PERMANENTLY',
						userId: result.id,
						email: result.email,
						deletedBy: validatedUser.id,
					},
					`Usuário deletado permanentemente: ${result.email}`,
				)

				return {
					success: true,
					message: result.message,
					data: {
						id: result.id,
						email: result.email,
						name: result.name,
					},
				}
			},
			{
				params: t.Object({
					id: t.String({ format: 'uuid' }),
				}),
				response: {
					200: t.Object({
						success: t.Boolean(),
						message: t.String(),
						data: t.Object({
							id: t.String(),
							email: t.String(),
							name: t.String(),
						}),
					}),
				},
			},
		),
)
