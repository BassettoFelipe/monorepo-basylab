import { t } from "elysia";

export const changePlanBodySchema = t.Object({
  planId: t.String({ minLength: 1 }),
});

export const changePlanResponseSchema = {
  200: t.Object({
    success: t.Literal(true),
    message: t.String(),
    subscription: t.Object({
      id: t.String(),
      planId: t.String(),
      plan: t.Object({
        id: t.String(),
        name: t.String(),
        price: t.Number(),
      }),
    }),
  }),
};
