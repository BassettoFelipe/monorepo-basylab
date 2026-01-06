import { t } from 'elysia'

export const deleteFeatureParamsSchema = t.Object({
	id: t.String(),
})

export const deleteFeatureResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
