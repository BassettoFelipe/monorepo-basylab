import { t } from "elysia";

export const activateSubscriptionBodySchema = t.Object({
  cardToken: t.String({ minLength: 1 }),
  payerDocument: t.String({ minLength: 11, maxLength: 14 }),
  installments: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
});

export const activateSubscriptionResponseSchema = {
  200: t.Object({
    success: t.Boolean(),
    message: t.String(),
    subscriptionId: t.String(),
    status: t.String(),
    accessToken: t.Optional(t.String()),
  }),
};
