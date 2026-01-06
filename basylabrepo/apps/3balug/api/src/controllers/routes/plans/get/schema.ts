import { t } from 'elysia'

export const getPlanParamsSchema = t.Object({
	id: t.String(),
})

export const getPlanResponseSchema = {
	200: t.Object({
		id: t.String(),
		name: t.String(),
		slug: t.String(),
		description: t.Union([t.String(), t.Null()]),
		price: t.Number(),
		maxUsers: t.Union([t.Number(), t.Null()]), // null = unlimited
		maxManagers: t.Number(),
		maxSerasaQueries: t.Number(),
		allowsLateCharges: t.Number(),
		features: t.Array(t.String()),
		createdAt: t.Date(),
		updatedAt: t.Date(),
	}),
}
