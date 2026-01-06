import { t } from "elysia";

export const deleteDocumentParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const deleteDocumentResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
});
