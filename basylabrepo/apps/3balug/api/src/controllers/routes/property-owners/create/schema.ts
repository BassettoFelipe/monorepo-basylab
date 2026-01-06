import { t } from "elysia";

export const createPropertyOwnerBodySchema = t.Object({
  name: t.String({ minLength: 2, maxLength: 200 }),
  documentType: t.Union([t.Literal("cpf"), t.Literal("cnpj")]),
  document: t.String({ minLength: 11, maxLength: 18 }),
  email: t.Optional(t.String({ format: "email" })),
  phone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
  address: t.Optional(t.String({ maxLength: 500 })),
  city: t.Optional(t.String({ maxLength: 100 })),
  state: t.Optional(t.String({ minLength: 2, maxLength: 2 })),
  zipCode: t.Optional(t.String({ minLength: 8, maxLength: 9 })),
  birthDate: t.Optional(t.String()),
  notes: t.Optional(t.String({ maxLength: 2000 })),
});

export const createPropertyOwnerResponseSchema = t.Object({
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
    createdAt: t.Date(),
  }),
});
