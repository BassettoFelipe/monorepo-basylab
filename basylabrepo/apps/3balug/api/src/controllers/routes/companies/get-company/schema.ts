import { t } from "elysia";

export const getCompanyResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.Union([t.String(), t.Null()]),
    cnpj: t.Union([t.String(), t.Null()]),
    phone: t.Union([t.String(), t.Null()]),
    address: t.Union([t.String(), t.Null()]),
    city: t.Union([t.String(), t.Null()]),
    state: t.Union([t.String(), t.Null()]),
    zipCode: t.Union([t.String(), t.Null()]),
  }),
});
