import { Elysia } from 'elysia'
import { customFields } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { updateBodySchema, updateParamsSchema, updateResponseSchema } from './schema'

export const updateCustomFieldController = new Elysia()
	.use(requireAuth)
	.use(validateUserState)
	.use(requireRole([USER_ROLES.OWNER]))
	.put(
		'/custom-fields/:id',
		async ({ validatedUser, params, body }) => {
			const field = await customFields.update.execute({
				user: validatedUser,
				fieldId: params.id,
				...body,
			})

			return {
				success: true as const,
				message: 'Campo atualizado com sucesso',
				data: field,
			}
		},
		{
			params: updateParamsSchema,
			body: updateBodySchema,
			response: updateResponseSchema,
		},
	)
