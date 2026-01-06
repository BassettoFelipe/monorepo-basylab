import { t } from "elysia";

export const updatePropertyOwnerParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const updatePropertyOwnerBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 200 })),
  documentType: t.Optional(t.Union([t.Literal("cpf"), t.Literal("cnpj")])),
  document: t.Optional(t.String({ minLength: 11, maxLength: 18 })),
  email: t.Optional(t.Union([t.String({ format: "email" }), t.Null()])),
  phone: t.Optional(t.Union([t.String({ minLength: 10, maxLength: 15 }), t.Null()])),
  address: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
  city: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
  state: t.Optional(t.Union([t.String({ minLength: 2, maxLength: 2 }), t.Null()])),
  zipCode: t.Optional(t.Union([t.String({ minLength: 8, maxLength: 9 }), t.Null()])),
  birthDate: t.Optional(t.Union([t.String(), t.Null()])),
  notes: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
});

export const updatePropertyOwnerResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Object({
    id: t.String(),
    companyId: t.String(),
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
    createdBy: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
});
