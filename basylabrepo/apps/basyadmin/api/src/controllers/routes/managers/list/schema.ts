import { t } from 'elysia'

const managerSchema = t.Object({
	id: t.String(),
	email: t.String(),
	name: t.String(),
	role: t.String(),
	isActive: t.Union([t.Boolean(), t.Null()]),
	createdAt: t.Union([t.Date(), t.Null()]),
	updatedAt: t.Union([t.Date(), t.Null()]),
})

export const listManagersResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(managerSchema),
})
