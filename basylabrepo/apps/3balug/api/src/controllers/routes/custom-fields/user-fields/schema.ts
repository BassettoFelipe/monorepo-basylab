import { t } from 'elysia'
import { CustomFieldWithValueSchema } from '../common-schemas'

export const userFieldsParamsSchema = t.Object({
	targetUserId: t.String(),
})

export const userFieldsResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		data: t.Array(CustomFieldWithValueSchema),
		user: t.Object({
			id: t.String(),
			name: t.String(),
			email: t.String(),
			avatarUrl: t.Union([t.String(), t.Null()]),
		}),
	}),
}
