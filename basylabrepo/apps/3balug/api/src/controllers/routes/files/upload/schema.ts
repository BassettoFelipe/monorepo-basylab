import { t } from 'elysia'

export const uploadFileBodySchema = t.Object({
	file: t.File({
		maxSize: '10m',
	}),
	fieldId: t.Optional(t.String()),
	maxFileSize: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 10 }), t.String()])),
	allowedTypes: t.Optional(t.String()),
})

export const uploadFileResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		url: t.String(),
		key: t.String(),
		size: t.Number(),
		contentType: t.String(),
		fileName: t.String(),
	}),
})
