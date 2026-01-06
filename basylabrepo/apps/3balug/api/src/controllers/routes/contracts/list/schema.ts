import { t } from 'elysia'
import { CONTRACT_STATUS } from '@/db/schema/contracts'

export const listContractsQuerySchema = t.Object({
	page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
	status: t.Optional(
		t.Union([
			t.Literal(CONTRACT_STATUS.ACTIVE),
			t.Literal(CONTRACT_STATUS.TERMINATED),
			t.Literal(CONTRACT_STATUS.CANCELLED),
			t.Literal(CONTRACT_STATUS.EXPIRED),
		]),
	),
	propertyId: t.Optional(t.String({ format: 'uuid' })),
	tenantId: t.Optional(t.String({ format: 'uuid' })),
	ownerId: t.Optional(t.String({ format: 'uuid' })),
})

export const contractResponseSchema = t.Object({
	id: t.String(),
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
})

export const listContractsResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(contractResponseSchema),
	pagination: t.Object({
		page: t.Number(),
		limit: t.Number(),
		total: t.Number(),
		totalPages: t.Number(),
	}),
})
