import { t } from 'elysia'
import { documentResponseSchema, entityTypeSchema } from '../common-schemas'

export const listDocumentsParamsSchema = t.Object({
	entityType: entityTypeSchema,
	entityId: t.String(),
})

export const listDocumentsResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(documentResponseSchema),
	total: t.Number(),
})
