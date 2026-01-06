import { t } from "elysia";

export const createContractBodySchema = t.Object({
  propertyId: t.String({ format: "uuid" }),
  tenantId: t.String({ format: "uuid" }),
  brokerId: t.Optional(t.String({ format: "uuid" })),
  startDate: t.String({ format: "date" }),
  endDate: t.String({ format: "date" }),
  rentalAmount: t.Number({ minimum: 1 }),
  paymentDay: t.Number({ minimum: 1, maximum: 31 }),
  depositAmount: t.Optional(t.Number({ minimum: 0 })),
  notes: t.Optional(t.String({ maxLength: 2000 })),
});

export const createContractResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Object({
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
    notes: t.Union([t.String(), t.Null()]),
    createdAt: t.Date(),
  }),
});
