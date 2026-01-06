import { Elysia } from 'elysia'
import { customFields } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { listQuerySchema, listResponseSchema } from './schema'

export const listCustomFieldsController = new Elysia()
	.use(requireAuth)
	.use(validateUserState)
	.get(
		'/custom-fields',
		async ({ validatedUser, query }) => {
			const result = await customFields.list.execute({
				user: validatedUser,
				includeInactive: query.includeInactive === 'true',
			})

			return {
				success: true as const,
				data: result.fields,
				hasFeature: result.hasFeature,
			}
		},
		{
			query: listQuerySchema,
			response: listResponseSchema,
		},
	)
