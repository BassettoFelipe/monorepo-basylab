import { t } from 'elysia'

export const createManagerBodySchema = t.Object({
	email: t.String({ format: 'email' }),
	name: t.String({ minLength: 1, maxLength: 100 }),
	password: t.String({ minLength: 6 }),
})

export const createManagerResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		id: t.String(),
		email: t.String(),
		name: t.String(),
		role: t.String(),
		isActive: t.Union([t.Boolean(), t.Null()]),
		createdAt: t.Union([t.Date(), t.Null()]),
		updatedAt: t.Union([t.Date(), t.Null()]),
	}),
})
