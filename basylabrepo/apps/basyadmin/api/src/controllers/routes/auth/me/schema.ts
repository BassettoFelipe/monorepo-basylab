import { t } from 'elysia'

export const meResponseSchema = t.Object({
	id: t.String(),
	email: t.String(),
	name: t.String(),
	role: t.Union([t.Literal('owner'), t.Literal('manager')]),
	isActive: t.Union([t.Boolean(), t.Null()]),
	createdAt: t.Union([t.Date(), t.Null()]),
})
