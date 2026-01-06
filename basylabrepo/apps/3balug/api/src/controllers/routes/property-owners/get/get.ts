import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { getPropertyOwnerParamsSchema, getPropertyOwnerResponseSchema } from './schema'

export const getPropertyOwnerController = new Elysia().guard({ as: 'local' }, (app) =>
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
			'/property-owners/:id',
			async ({ validatedUser, params }) => {
				const result = await container.propertyOwners.get.execute({
					id: params.id,
					requestedBy: validatedUser,
				})

				return {
					success: true,
					data: result,
				}
			},
			{
				params: getPropertyOwnerParamsSchema,
				response: {
					200: getPropertyOwnerResponseSchema,
				},
			},
		),
)
