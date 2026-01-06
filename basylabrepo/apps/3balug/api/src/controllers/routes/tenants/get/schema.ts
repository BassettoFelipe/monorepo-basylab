import { t } from "elysia";

export const getTenantParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const getTenantResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    id: t.String(),
    companyId: t.String(),
    name: t.String(),
    cpf: t.String(),
    email: t.Union([t.String(), t.Null()]),
    phone: t.Union([t.String(), t.Null()]),
    birthDate: t.Union([t.String(), t.Null()]),
    monthlyIncome: t.Union([t.Number(), t.Null()]),
    employer: t.Union([t.String(), t.Null()]),
    emergencyContact: t.Union([t.String(), t.Null()]),
    emergencyPhone: t.Union([t.String(), t.Null()]),
    address: t.Union([t.String(), t.Null()]),
    city: t.Union([t.String(), t.Null()]),
    state: t.Union([t.String(), t.Null()]),
    zipCode: t.Union([t.String(), t.Null()]),
    notes: t.Union([t.String(), t.Null()]),
  }),
});
