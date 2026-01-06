import { Elysia } from "elysia";
import { auth } from "@/container";
import { verificationRateLimitPlugin } from "@/plugins/rate-limit.plugin";
import { confirmEmailBodySchema, confirmEmailResponseSchema } from "./schema";

export const confirmEmailController = new Elysia().use(verificationRateLimitPlugin).post(
  "/auth/confirm-email",
  async ({ body, set }) => {
    const result = await auth.confirmEmail.execute(body);

    set.status = 200;
    return {
      success: true,
      message: "Email verificado com sucesso",
      checkoutToken: result.checkoutToken,
      checkoutExpiresAt: result.checkoutExpiresAt,
    };
  },
  {
    body: confirmEmailBodySchema,
    response: confirmEmailResponseSchema,
  },
);
