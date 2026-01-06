import { Elysia, t } from 'elysia'
import { logger } from '@/config/logger'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { UpdateUserSchema } from './schema'

export const updateUserController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
		.put(
			'/users/:id',
			async ({ validatedUser, params, body }) => {
				const result = await container.users.updateUser.execute({
					userId: params.id,
					updatedBy: validatedUser,
					...body,
				})

				logger.info(
					{
						event: 'USER_UPDATED',
						userId: result.id,
						email: result.email,
						updatedBy: validatedUser.id,
						changes: body,
					},
					`Usuário atualizado: ${result.email}`,
				)

				return {
					success: true,
					message: 'Usuário atualizado com sucesso',
					data: result,
				}
			},
			{
				params: t.Object({
					id: t.String({ format: 'uuid' }),
				}),
				body: UpdateUserSchema,
				response: {
					200: t.Object({
						success: t.Boolean(),
						message: t.String(),
						data: t.Object({
							id: t.String(),
							email: t.String(),
							name: t.String(),
							role: t.String(),
							companyId: t.Union([t.String(), t.Null()]),
							isActive: t.Boolean(),
						}),
					}),
				},
			},
		),
)
