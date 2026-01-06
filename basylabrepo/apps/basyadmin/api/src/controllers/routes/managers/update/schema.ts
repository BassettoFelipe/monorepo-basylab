import { t } from 'elysia'

export const updateManagerParamsSchema = t.Object({
	id: t.String(),
})

export const updateManagerBodySchema = t.Object({
	email: t.Optional(t.String({ format: 'email' })),
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	password: t.Optional(t.String({ minLength: 6 })),
	isActive: t.Optional(t.Boolean()),
})

export const updateManagerResponseSchema = t.Object({
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
