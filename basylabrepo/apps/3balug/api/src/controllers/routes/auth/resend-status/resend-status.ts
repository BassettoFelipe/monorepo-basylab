import { Elysia } from "elysia";
import { auth } from "@/container";
import { resendRateLimitPlugin } from "@/plugins/rate-limit.plugin";
import { resendStatusBodySchema, resendStatusResponseSchema } from "./schema";

export const resendStatusController = new Elysia().use(resendRateLimitPlugin).post(
  "/auth/resend-status",
  async ({ body }) => {
    const result = await auth.getResendStatus.execute(body.email);

    return {
      remainingAttempts: result.remainingAttempts,
      canResendAt: result.canResendAt,
      canResend: result.canResend,
      isBlocked: result.isBlocked,
      blockedUntil: result.blockedUntil,
    };
  },
  {
    body: resendStatusBodySchema,
    response: resendStatusResponseSchema,
  },
);
