import { t } from "elysia";

export const updateContractParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const updateContractBodySchema = t.Object({
  rentalAmount: t.Optional(t.Number({ minimum: 1 })),
  paymentDay: t.Optional(t.Number({ minimum: 1, maximum: 31 })),
  depositAmount: t.Optional(t.Number({ minimum: 0 })),
  notes: t.Optional(t.String({ maxLength: 2000 })),
});

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
});

export const updateContractResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: contractResponseSchema,
});
