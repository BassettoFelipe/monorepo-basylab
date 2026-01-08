import { t } from 'elysia'

export const uploadPhotoParamsSchema = t.Object({
	id: t.String(),
})

export const uploadPhotoBodySchema = t.Object({
	file: t.File({
		maxSize: '10m',
	}),
	isPrimary: t.Optional(t.Union([t.Boolean(), t.String()])),
})

export const uploadPhotoResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		id: t.String(),
		propertyId: t.String(),
		filename: t.String(),
		originalName: t.String(),
		mimeType: t.String(),
		size: t.Number(),
		url: t.String(),
		order: t.Number(),
		isPrimary: t.Boolean(),
		createdAt: t.Date(),
	}),
})

export const deletePhotoParamsSchema = t.Object({
	id: t.String(),
	photoId: t.String(),
})

export const deletePhotoResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})

export const setPrimaryPhotoParamsSchema = t.Object({
	id: t.String(),
	photoId: t.String(),
})

export const setPrimaryPhotoResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})

// Batch register schemas for parallel upload with presigned URLs
export const batchRegisterPhotosParamsSchema = t.Object({
	id: t.String(),
})

// Max file size: 10MB in bytes
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

export const batchRegisterPhotoItemSchema = t.Object({
	key: t.String(),
	originalName: t.String({ maxLength: 255 }),
	mimeType: t.String({ pattern: '^image/(jpeg|png|webp|gif)$' }),
	size: t.Number({ minimum: 1, maximum: MAX_PHOTO_SIZE }),
	url: t.String(),
	isPrimary: t.Optional(t.Boolean()),
})

export const batchRegisterPhotosBodySchema = t.Object({
	photos: t.Array(batchRegisterPhotoItemSchema, { minItems: 1, maxItems: 20 }),
})

export const batchRegisterPhotosResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		registered: t.Number(),
		photos: t.Array(
			t.Object({
				id: t.String(),
				propertyId: t.String(),
				filename: t.String(),
				originalName: t.String(),
				mimeType: t.String(),
				size: t.Number(),
				url: t.String(),
				order: t.Number(),
				isPrimary: t.Boolean(),
				createdAt: t.Date(),
			}),
		),
	}),
})
