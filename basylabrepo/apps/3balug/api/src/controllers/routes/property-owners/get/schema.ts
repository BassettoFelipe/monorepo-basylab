import { t } from 'elysia'

export const getPropertyOwnerParamsSchema = t.Object({
	id: t.String({ format: 'uuid' }),
})

export const getPropertyOwnerResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Object({
		id: t.String(),
		companyId: t.String(),
		name: t.String(),
		document: t.String(),
		documentType: t.String(),
		rg: t.Union([t.String(), t.Null()]),
		nationality: t.Union([t.String(), t.Null()]),
		maritalStatus: t.Union([t.String(), t.Null()]),
		profession: t.Union([t.String(), t.Null()]),
		email: t.Union([t.String(), t.Null()]),
		phone: t.Union([t.String(), t.Null()]),
		phoneSecondary: t.Union([t.String(), t.Null()]),
		birthDate: t.Union([t.String(), t.Null()]),
		address: t.Union([t.String(), t.Null()]),
		addressNumber: t.Union([t.String(), t.Null()]),
		addressComplement: t.Union([t.String(), t.Null()]),
		neighborhood: t.Union([t.String(), t.Null()]),
		city: t.Union([t.String(), t.Null()]),
		state: t.Union([t.String(), t.Null()]),
		zipCode: t.Union([t.String(), t.Null()]),
		photoUrl: t.Union([t.String(), t.Null()]),
		notes: t.Union([t.String(), t.Null()]),
	}),
})
