import { Elysia, t } from 'elysia'
import { logger } from '@/config/logger'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { CreateUserSchema } from './schema'

export const createUserController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
		.post(
			'/users',
			async ({ validatedUser, body }) => {
				const result = await container.users.createUser.execute({
					...body,
					createdBy: validatedUser,
				})

				logger.info(
					{
						event: 'USER_CREATED',
						userId: result.id,
						email: result.email,
						role: result.role,
						createdBy: validatedUser.id,
					},
					`Usuário criado: ${result.email}`,
				)

				return {
					success: true,
					message: 'Usuário criado com sucesso',
					data: result,
				}
			},
			{
				body: CreateUserSchema,
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
