import { t } from "elysia";

export const processCardPaymentSchema = t.Object({
  pendingPaymentId: t.String({ format: "uuid" }),
  cardToken: t.String({ minLength: 1 }),
  installments: t.Integer({ minimum: 1, maximum: 12 }),
});
