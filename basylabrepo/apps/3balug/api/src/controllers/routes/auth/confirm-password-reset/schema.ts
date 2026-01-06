import { t } from "elysia";

export const confirmPasswordResetBodySchema = t.Object({
  email: t.String({
    format: "email",
    error: "Email inválido",
  }),
  code: t.String({
    minLength: 6,
    maxLength: 6,
    error: "Código deve ter 6 dígitos",
  }),
  newPassword: t.String({
    minLength: 8,
    maxLength: 100,
    error: "Senha deve ter entre 8 e 100 caracteres",
  }),
});

export const confirmPasswordResetResponseSchema = {
  200: t.Object({
    message: t.String(),
    success: t.Boolean(),
  }),
};
