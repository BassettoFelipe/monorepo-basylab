import { Elysia, t } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { UserResponseSchema } from '../common-schemas'
import { ListUsersQuerySchema } from './schema'

export const listUsersController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
		.get(
			'/users',
			async ({ validatedUser, query }) => {
				const result = await container.users.listUsers.execute({
					requestedBy: validatedUser,
					role: query.role,
					isActive: query.isActive,
					page: query.page,
					limit: query.limit,
				})

				return {
					success: true,
					data: result,
				}
			},
			{
				query: ListUsersQuerySchema,
				response: {
					200: t.Object({
						success: t.Boolean(),
						data: t.Object({
							users: t.Array(UserResponseSchema),
							total: t.Number(),
							page: t.Number(),
							limit: t.Number(),
							totalPages: t.Number(),
						}),
					}),
				},
			},
		),
)
