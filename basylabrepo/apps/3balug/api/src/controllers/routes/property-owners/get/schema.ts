import { t } from 'elysia'

import { nullableString } from '@/types/schemas'

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
		rg: nullableString,
		nationality: nullableString,
		maritalStatus: nullableString,
		profession: nullableString,
		email: nullableString,
		phone: nullableString,
		phoneSecondary: nullableString,
		birthDate: nullableString,
		address: nullableString,
		addressNumber: nullableString,
		addressComplement: nullableString,
		neighborhood: nullableString,
		city: nullableString,
		state: nullableString,
		zipCode: nullableString,
		photoUrl: nullableString,
		notes: nullableString,
		createdAt: t.String(),
		updatedAt: t.String(),
	}),
})
