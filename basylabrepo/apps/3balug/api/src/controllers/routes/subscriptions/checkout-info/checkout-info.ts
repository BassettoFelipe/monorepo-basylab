import { Elysia } from "elysia";
import { container } from "@/container";
import { requireCheckout } from "@/controllers/middlewares/checkout.middleware";
import { checkoutInfoResponseSchema } from "./schema";

export const checkoutInfoController = new Elysia().use(requireCheckout).get(
  "/subscriptions/checkout-info",
  async ({ userId, checkoutPayload, set }) => {
    const result = await container.subscriptions.getCheckoutInfo.execute({
      userId,
      checkoutPayload,
    });

    set.status = 200;
    return result;
  },
  {
    response: checkoutInfoResponseSchema,
  },
);
