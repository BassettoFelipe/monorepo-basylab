import { t } from 'elysia'
import { FIELD_TYPES } from '@/db/schema/custom-fields'

export const FieldTypeEnum = t.Union([
	t.Literal(FIELD_TYPES.TEXT),
	t.Literal(FIELD_TYPES.TEXTAREA),
	t.Literal(FIELD_TYPES.NUMBER),
	t.Literal(FIELD_TYPES.EMAIL),
	t.Literal(FIELD_TYPES.PHONE),
	t.Literal(FIELD_TYPES.SELECT),
	t.Literal(FIELD_TYPES.CHECKBOX),
	t.Literal(FIELD_TYPES.DATE),
	t.Literal(FIELD_TYPES.FILE),
])

export const FileConfigSchema = t.Object({
	maxFileSize: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
	maxFiles: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
	allowedTypes: t.Optional(t.Array(t.String())),
})

export const ValidationSchema = t.Object({
	minLength: t.Optional(t.Number()),
	maxLength: t.Optional(t.Number()),
	min: t.Optional(t.Number()),
	max: t.Optional(t.Number()),
	pattern: t.Optional(t.String()),
})

export const CustomFieldSchema = t.Object({
	id: t.String(),
	label: t.String(),
	type: t.String(),
	placeholder: t.Union([t.String(), t.Null()]),
	helpText: t.Union([t.String(), t.Null()]),
	isRequired: t.Boolean(),
	options: t.Union([t.Array(t.String()), t.Null()]),
	allowMultiple: t.Union([t.Boolean(), t.Null()]),
	validation: t.Union([ValidationSchema, t.Null()]),
	fileConfig: t.Union([FileConfigSchema, t.Null()]),
	order: t.Number(),
	isActive: t.Boolean(),
})

export const CustomFieldWithValueSchema = t.Object({
	id: t.String(),
	label: t.String(),
	type: t.String(),
	placeholder: t.Union([t.String(), t.Null()]),
	helpText: t.Union([t.String(), t.Null()]),
	isRequired: t.Boolean(),
	options: t.Union([t.Array(t.String()), t.Null()]),
	allowMultiple: t.Union([t.Boolean(), t.Null()]),
	validation: t.Union([ValidationSchema, t.Null()]),
	fileConfig: t.Union([FileConfigSchema, t.Null()]),
	order: t.Number(),
	isActive: t.Boolean(),
	value: t.Union([t.String(), t.Null()]),
})
