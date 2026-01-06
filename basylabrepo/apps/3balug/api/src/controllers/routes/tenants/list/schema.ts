import { t } from "elysia";

export const listTenantsQuerySchema = t.Object({
  search: t.Optional(t.String()),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export const tenantResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  cpf: t.String(),
  email: t.Union([t.String(), t.Null()]),
  phone: t.Union([t.String(), t.Null()]),
  address: t.Union([t.String(), t.Null()]),
  city: t.Union([t.String(), t.Null()]),
  state: t.Union([t.String(), t.Null()]),
  zipCode: t.Union([t.String(), t.Null()]),
  birthDate: t.Union([t.String(), t.Null()]),
  monthlyIncome: t.Union([t.Number(), t.Null()]),
  employer: t.Union([t.String(), t.Null()]),
  emergencyContact: t.Union([t.String(), t.Null()]),
  emergencyPhone: t.Union([t.String(), t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
});

export const listTenantsResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(tenantResponseSchema),
  total: t.Number(),
  limit: t.Number(),
  offset: t.Number(),
});
