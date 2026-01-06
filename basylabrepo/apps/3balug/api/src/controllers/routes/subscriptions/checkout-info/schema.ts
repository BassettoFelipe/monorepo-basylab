import { t } from "elysia";

export const checkoutInfoResponseSchema = {
  200: t.Object({
    user: t.Object({
      name: t.String(),
      email: t.String(),
    }),
    subscription: t.Object({
      id: t.String(),
      status: t.String(),
    }),
    plan: t.Object({
      id: t.String(),
      name: t.String(),
      price: t.Number(),
      features: t.Array(t.String()),
    }),
  }),
};
