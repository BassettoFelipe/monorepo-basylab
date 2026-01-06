import { t } from "elysia";

export const getContractParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const contractResponseSchema = t.Object({
  id: t.String(),
  companyId: t.String(),
  startDate: t.Date(),
  endDate: t.Date(),
  rentalAmount: t.Number(),
  paymentDay: t.Number(),
  depositAmount: t.Union([t.Number(), t.Null()]),
  status: t.String(),
  notes: t.Union([t.String(), t.Null()]),
  terminatedAt: t.Union([t.Date(), t.Null()]),
  terminationReason: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  propertyId: t.String(),
  property: t.Union([
    t.Object({
      id: t.String(),
      title: t.String(),
      address: t.Union([t.String(), t.Null()]),
      city: t.Union([t.String(), t.Null()]),
      type: t.String(),
      listingType: t.String(),
      status: t.String(),
    }),
    t.Null(),
  ]),
  ownerId: t.String(),
  owner: t.Union([
    t.Object({
      id: t.String(),
      name: t.String(),
      document: t.String(),
      email: t.Union([t.String(), t.Null()]),
      phone: t.Union([t.String(), t.Null()]),
    }),
    t.Null(),
  ]),
  tenantId: t.String(),
  tenant: t.Union([
    t.Object({
      id: t.String(),
      name: t.String(),
      document: t.String(),
      email: t.Union([t.String(), t.Null()]),
      phone: t.Union([t.String(), t.Null()]),
    }),
    t.Null(),
  ]),
  brokerId: t.Union([t.String(), t.Null()]),
  broker: t.Union([
    t.Object({
      id: t.String(),
      name: t.String(),
      email: t.String(),
    }),
    t.Null(),
  ]),
});

export const getContractResponseSchema = t.Object({
  success: t.Boolean(),
  data: contractResponseSchema,
});
