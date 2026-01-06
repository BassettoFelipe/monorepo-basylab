import { t } from 'elysia'

export const regenerateKeyParamsSchema = t.Object({
	tenantId: t.String(),
})

export const regenerateKeyResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	apiKey: t.String(),
})
