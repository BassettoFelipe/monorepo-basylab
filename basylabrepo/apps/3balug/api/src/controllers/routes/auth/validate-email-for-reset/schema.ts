import { t } from "elysia";

export const validateEmailForResetBodySchema = t.Object({
  email: t.String({
    format: "email",
    error: "Email inválido",
  }),
});

export const validateEmailForResetResponseSchema = {
  200: t.Object({
    email: t.String(),
  }),
};
