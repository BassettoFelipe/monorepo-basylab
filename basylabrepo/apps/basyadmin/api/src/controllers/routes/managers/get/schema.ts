import { t } from 'elysia'

export const getManagerParamsSchema = t.Object({
	id: t.String(),
})

export const getManagerResponseSchema = t.Object({
	success: t.Boolean(),
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
