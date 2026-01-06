import { Elysia } from "elysia";
import { auth } from "@/container";
import { emailVerificationRateLimitPlugin } from "@/plugins/rate-limit.plugin";
import { resendVerificationCodeBodySchema, resendVerificationCodeResponseSchema } from "./schema";

export const resendVerificationCodeController = new Elysia()
  .use(emailVerificationRateLimitPlugin)
  .post(
    "/auth/resend-verification-code",
    async ({ body, set }) => {
      const result = await auth.resendVerificationCode.execute(body);

      set.status = 200;
      return result;
    },
    {
      body: resendVerificationCodeBodySchema,
      response: resendVerificationCodeResponseSchema,
    },
  );
