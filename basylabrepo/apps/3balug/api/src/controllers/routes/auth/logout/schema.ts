import { t } from "elysia";

export const logoutResponseSchema = {
  200: t.Object({
    success: t.Literal(true),
    message: t.String(),
  }),
};
