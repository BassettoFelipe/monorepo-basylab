import { t } from "elysia";

export const deletePropertyParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const deletePropertyResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
});
