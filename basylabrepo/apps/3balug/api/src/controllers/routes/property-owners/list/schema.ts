import { t } from "elysia";

export const listPropertyOwnersQuerySchema = t.Object({
  search: t.Optional(t.String()),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export const propertyOwnerResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  documentType: t.String(),
  document: t.String(),
  email: t.Union([t.String(), t.Null()]),
  phone: t.Union([t.String(), t.Null()]),
  address: t.Union([t.String(), t.Null()]),
  city: t.Union([t.String(), t.Null()]),
  state: t.Union([t.String(), t.Null()]),
  zipCode: t.Union([t.String(), t.Null()]),
  birthDate: t.Union([t.String(), t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
});

export const listPropertyOwnersResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(propertyOwnerResponseSchema),
  total: t.Number(),
  limit: t.Number(),
  offset: t.Number(),
});
