import { Elysia } from "elysia";
import { logger } from "@/config/logger";
import { payment } from "@/container";
import { createPendingPaymentBodySchema, createPendingPaymentResponseSchema } from "./schema";

export const createPendingPaymentController = new Elysia().post(
  "/payment/create-pending-payment",
  async ({ body, set }) => {
    try {
      logger.info({ msg: "Creating pending payment", email: body.email, planId: body.planId });
      const result = await payment.createPendingPayment.execute(body);
      logger.info({
        msg: "Pending payment created successfully",
        pendingPaymentId: result.pendingPaymentId,
      });

      set.status = 201;
      return {
        success: true,
        message: "Pending payment created successfully",
        data: result,
      };
    } catch (error) {
      logger.error({
        msg: "Error creating pending payment",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
  {
    body: createPendingPaymentBodySchema,
    response: createPendingPaymentResponseSchema,
  },
);
