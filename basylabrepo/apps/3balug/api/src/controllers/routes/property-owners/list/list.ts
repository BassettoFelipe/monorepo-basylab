import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { listPropertyOwnersQuerySchema, listPropertyOwnersResponseSchema } from './schema'

export const listPropertyOwnersController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(
			requireRole([
				USER_ROLES.OWNER,
				USER_ROLES.MANAGER,
				USER_ROLES.BROKER,
				USER_ROLES.INSURANCE_ANALYST,
			]),
		)
		.get(
			'/property-owners',
			async ({ validatedUser, query }) => {
				const result = await container.propertyOwners.list.execute({
					search: query.search,
					documentType: query.documentType,
					state: query.state,
					city: query.city,
					hasProperties:
						query.hasProperties === 'true'
							? true
							: query.hasProperties === 'false'
								? false
								: undefined,
					hasEmail:
						query.hasEmail === 'true' ? true : query.hasEmail === 'false' ? false : undefined,
					hasPhone:
						query.hasPhone === 'true' ? true : query.hasPhone === 'false' ? false : undefined,
					createdAtStart: query.createdAtStart ? new Date(query.createdAtStart) : undefined,
					createdAtEnd: query.createdAtEnd ? new Date(query.createdAtEnd) : undefined,
					sortBy: query.sortBy,
					sortOrder: query.sortOrder,
					limit: query.limit ? Number(query.limit) : undefined,
					offset: query.offset ? Number(query.offset) : undefined,
					requestedBy: validatedUser,
				})

				return {
					success: true,
					data: result.data,
					total: result.total,
					limit: result.limit,
					offset: result.offset,
				}
			},
			{
				query: listPropertyOwnersQuerySchema,
				response: {
					200: listPropertyOwnersResponseSchema,
				},
			},
		),
)
