import { t } from 'elysia'
import { deletedDocumentResponseSchema, entityTypeSchema } from '../common-schemas'

export const listDeletedDocumentsParamsSchema = t.Object({
	entityType: entityTypeSchema,
	entityId: t.String(),
})

export const listDeletedDocumentsResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(deletedDocumentResponseSchema),
	total: t.Number(),
})
