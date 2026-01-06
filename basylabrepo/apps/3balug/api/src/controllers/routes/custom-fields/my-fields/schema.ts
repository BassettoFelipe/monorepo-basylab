import { t } from 'elysia'
import { CustomFieldWithValueSchema } from '../common-schemas'

export const getMyFieldsResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		data: t.Array(CustomFieldWithValueSchema),
		hasFeature: t.Boolean(),
	}),
}

export const saveMyFieldsBodySchema = t.Object({
	fields: t.Array(
		t.Object({
			fieldId: t.String(),
			value: t.Union([t.String(), t.Null()]),
		}),
	),
})

export const saveMyFieldsResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		message: t.String(),
	}),
}
