import { t } from "elysia";

export const resendVerificationCodeBodySchema = t.Object({
  email: t.String({ format: "email" }),
});

export const resendVerificationCodeResponseSchema = {
  200: t.Object({
    success: t.Boolean(),
    message: t.String(),
    remainingAttempts: t.Number(),
    canResendAt: t.Date(),
    isBlocked: t.Boolean(),
    blockedUntil: t.Union([t.Date(), t.Null()]),
  }),
};
