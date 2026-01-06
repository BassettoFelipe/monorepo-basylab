import { t } from 'elysia'

export const deleteParamsSchema = t.Object({
	id: t.String(),
})

export const deleteResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		message: t.String(),
	}),
}
