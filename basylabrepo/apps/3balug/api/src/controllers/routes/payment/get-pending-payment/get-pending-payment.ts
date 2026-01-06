import { Elysia } from "elysia";
import { payment } from "@/container";
import { getPendingPaymentParamsSchema, getPendingPaymentResponseSchema } from "./schema";

export const getPendingPaymentController = new Elysia().get(
  "/payment/pending-payment/:id",
  async ({ params }) => {
    const result = await payment.getPendingPayment.execute({
      pendingPaymentId: params.id,
    });

    return {
      success: true,
      data: result,
    };
  },
  {
    params: getPendingPaymentParamsSchema,
    response: {
      200: getPendingPaymentResponseSchema,
    },
  },
);
