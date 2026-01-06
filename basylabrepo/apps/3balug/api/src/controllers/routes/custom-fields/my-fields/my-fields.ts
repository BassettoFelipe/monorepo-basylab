import { Elysia } from 'elysia'
import { customFields } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import {
	getMyFieldsResponseSchema,
	saveMyFieldsBodySchema,
	saveMyFieldsResponseSchema,
} from './schema'

export const myFieldsController = new Elysia()
	.use(requireAuth)
	.use(validateUserState)
	.get(
		'/custom-fields/my-fields',
		async ({ validatedUser }) => {
			const result = await customFields.getMyFields.execute({
				user: validatedUser,
			})

			return {
				success: true as const,
				data: result.fields,
				hasFeature: result.hasFeature,
			}
		},
		{
			response: getMyFieldsResponseSchema,
		},
	)
	.post(
		'/custom-fields/my-fields',
		async ({ validatedUser, body }) => {
			const result = await customFields.saveMyFields.execute({
				user: validatedUser,
				fields: body.fields,
			})

			return result
		},
		{
			body: saveMyFieldsBodySchema,
			response: saveMyFieldsResponseSchema,
		},
	)
