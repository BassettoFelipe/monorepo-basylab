import { Elysia } from "elysia";
import { container } from "@/container";
import { requireCheckout } from "@/controllers/middlewares/checkout.middleware";
import { activateSubscriptionBodySchema, activateSubscriptionResponseSchema } from "./schema";

export const activateSubscriptionController = new Elysia().use(requireCheckout).post(
  "/subscriptions/activate",
  async ({ body, userId, subscriptionId, planId, set }) => {
    const result = await container.subscriptions.activate.execute({
      userId,
      subscriptionId,
      planId,
      cardToken: body.cardToken,
      payerDocument: body.payerDocument,
      installments: body.installments,
    });

    set.status = 200;
    return result;
  },
  {
    body: activateSubscriptionBodySchema,
    response: activateSubscriptionResponseSchema,
  },
);
