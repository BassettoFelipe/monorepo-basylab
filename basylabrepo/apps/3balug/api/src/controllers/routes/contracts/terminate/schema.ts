import { t } from 'elysia'

export const terminateContractParamsSchema = t.Object({
	id: t.String({ format: 'uuid' }),
})

export const terminateContractBodySchema = t.Object({
	reason: t.Optional(t.String({ maxLength: 500 })),
})

export const contractResponseSchema = t.Object({
	id: t.String(),
	companyId: t.String(),
	propertyId: t.String(),
	ownerId: t.String(),
	tenantId: t.String(),
	brokerId: t.Union([t.String(), t.Null()]),
	startDate: t.Date(),
	endDate: t.Date(),
	rentalAmount: t.Number(),
	paymentDay: t.Number(),
	depositAmount: t.Union([t.Number(), t.Null()]),
	status: t.String(),
	terminatedAt: t.Union([t.Date(), t.Null()]),
	terminationReason: t.Union([t.String(), t.Null()]),
	notes: t.Union([t.String(), t.Null()]),
	createdAt: t.Date(),
	updatedAt: t.Date(),
})

export const terminateContractResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: contractResponseSchema,
})
