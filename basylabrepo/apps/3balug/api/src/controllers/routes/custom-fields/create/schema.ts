import { t } from 'elysia'
import {
	CustomFieldSchema,
	FieldTypeEnum,
	FileConfigSchema,
	ValidationSchema,
} from '../common-schemas'

export const createBodySchema = t.Object({
	label: t.String({ minLength: 2 }),
	type: FieldTypeEnum,
	placeholder: t.Optional(t.String()),
	helpText: t.Optional(t.String()),
	isRequired: t.Optional(t.Boolean()),
	options: t.Optional(t.Array(t.String())),
	allowMultiple: t.Optional(t.Boolean()),
	validation: t.Optional(ValidationSchema),
	fileConfig: t.Optional(FileConfigSchema),
})

export const createResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		message: t.String(),
		data: CustomFieldSchema,
	}),
}
