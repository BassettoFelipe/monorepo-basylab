import { t } from 'elysia'

export const updateCompanyBodySchema = t.Object({
	name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
})

export const updateCompanyResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		id: t.String(),
		name: t.String(),
		email: t.Union([t.String(), t.Null()]),
	}),
})
