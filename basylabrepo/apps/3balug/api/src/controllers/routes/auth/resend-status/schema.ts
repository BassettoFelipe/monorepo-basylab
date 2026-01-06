import { t } from "elysia";

export const resendStatusBodySchema = t.Object({
  email: t.String({ format: "email" }),
});

export const resendStatusResponseSchema = {
  200: t.Object({
    remainingAttempts: t.Number(),
    canResendAt: t.Union([t.Date(), t.Null()]),
    canResend: t.Boolean(),
    isBlocked: t.Boolean(),
    blockedUntil: t.Union([t.Date(), t.Null()]),
  }),
};
