import { t } from 'elysia'
import { brazilianStateSchema, maritalStatusSchema, nullableString } from '@/types/schemas'

export const updatePropertyOwnerParamsSchema = t.Object({
	id: t.String({ format: 'uuid' }),
})

export const updatePropertyOwnerBodySchema = t.Object({
	name: t.Optional(t.String({ minLength: 2, maxLength: 200 })),
	documentType: t.Optional(t.Union([t.Literal('cpf'), t.Literal('cnpj')])),
	document: t.Optional(t.String({ minLength: 11, maxLength: 18 })),
	rg: t.Optional(t.Union([t.String({ maxLength: 20 }), t.Null()])),
	nationality: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
	maritalStatus: t.Optional(t.Union([maritalStatusSchema, t.Null()])),
	profession: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
	email: t.Optional(t.Union([t.String({ format: 'email' }), t.Null()])),
	phone: t.Optional(t.Union([t.String({ minLength: 10, maxLength: 15 }), t.Null()])),
	phoneSecondary: t.Optional(t.Union([t.String({ minLength: 10, maxLength: 15 }), t.Null()])),
	address: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
	addressNumber: t.Optional(t.Union([t.String({ maxLength: 20 }), t.Null()])),
	addressComplement: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
	neighborhood: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
	city: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
	state: t.Optional(t.Union([brazilianStateSchema, t.Null()])),
	zipCode: t.Optional(t.Union([t.String({ minLength: 8, maxLength: 9 }), t.Null()])),
	birthDate: t.Optional(t.Union([t.String(), t.Null()])),
	photoUrl: t.Optional(t.Union([t.String(), t.Null()])),
	notes: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
})

export const updatePropertyOwnerResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		id: t.String(),
		companyId: t.String(),
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
		createdBy: t.String(),
		createdAt: t.Date(),
		updatedAt: t.Date(),
	}),
})
