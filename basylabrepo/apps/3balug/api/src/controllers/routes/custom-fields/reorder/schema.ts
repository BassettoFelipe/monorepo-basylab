import { t } from "elysia";

export const reorderBodySchema = t.Object({
  fieldIds: t.Array(t.String()),
});

export const reorderResponseSchema = {
  200: t.Object({
    success: t.Literal(true),
    message: t.String(),
  }),
};
