import { t } from 'elysia'

export const UPLOAD_ENTITY_TYPES = {
	TENANT: 'tenant',
	PROPERTY_OWNER: 'property_owner',
	PROPERTY: 'property',
	USER: 'user',
} as const

export type UploadEntityType = (typeof UPLOAD_ENTITY_TYPES)[keyof typeof UPLOAD_ENTITY_TYPES]

export const presignedUrlBodySchema = t.Object({
	fileName: t.String({ minLength: 1, maxLength: 255 }),
	contentType: t.String({ minLength: 1, maxLength: 100 }),
	entityType: t.Union([
		t.Literal('tenant'),
		t.Literal('property_owner'),
		t.Literal('property'),
		t.Literal('user'),
	]),
	entityId: t.String({ format: 'uuid' }),
	fieldId: t.Optional(t.String({ maxLength: 100 })),
	allowedTypes: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 10 })),
})

export const presignedUrlResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		uploadUrl: t.String(),
		key: t.String(),
		publicUrl: t.String(),
		expiresAt: t.Date(),
	}),
})
