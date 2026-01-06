import { t } from "elysia";
import { documentResponseSchema, documentTypeSchema, entityTypeSchema } from "../common-schemas";

export const uploadDocumentBodySchema = t.Object({
  file: t.File({
    maxSize: "10m",
  }),
  entityType: entityTypeSchema,
  entityId: t.String(),
  documentType: documentTypeSchema,
  description: t.Optional(t.String()),
});

export const uploadDocumentResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: documentResponseSchema,
});
