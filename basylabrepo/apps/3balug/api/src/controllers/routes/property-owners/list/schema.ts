import { t } from 'elysia'
import { nullableString } from '@/types/schemas'

export const listPropertyOwnersQuerySchema = t.Object({
	search: t.Optional(t.String()),
	documentType: t.Optional(t.Union([t.Literal('cpf'), t.Literal('cnpj')])),
	state: t.Optional(t.String()),
	city: t.Optional(t.String()),
	hasProperties: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
	hasEmail: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
	hasPhone: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
	createdAtStart: t.Optional(t.String()),
	createdAtEnd: t.Optional(t.String()),
	sortBy: t.Optional(
		t.Union([
			t.Literal('name'),
			t.Literal('createdAt'),
			t.Literal('propertiesCount'),
			t.Literal('city'),
			t.Literal('state'),
		]),
	),
	sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
	offset: t.Optional(t.Numeric({ minimum: 0 })),
})

export const propertyOwnerResponseSchema = t.Object({
	id: t.String(),
	name: t.String(),
	documentType: t.String(),
	document: t.String(),
	rg: nullableString,
	nationality: nullableString,
	maritalStatus: nullableString,
	profession: nullableString,
	email: nullableString,
	phone: nullableString,
	phoneSecondary: nullableString,
	address: nullableString,
	addressNumber: nullableString,
	addressComplement: nullableString,
	neighborhood: nullableString,
	city: nullableString,
	state: nullableString,
	zipCode: nullableString,
	birthDate: nullableString,
	photoUrl: nullableString,
	notes: nullableString,
	createdAt: t.Date(),
	propertiesCount: t.Optional(t.Number()),
})

export const listPropertyOwnersResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(propertyOwnerResponseSchema),
	total: t.Number(),
	limit: t.Number(),
	offset: t.Number(),
})
