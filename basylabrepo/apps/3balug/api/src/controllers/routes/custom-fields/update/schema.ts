import { t } from "elysia";
import {
  CustomFieldSchema,
  FieldTypeEnum,
  FileConfigSchema,
  ValidationSchema,
} from "../common-schemas";

export const updateParamsSchema = t.Object({
  id: t.String(),
});

export const updateBodySchema = t.Object({
  label: t.Optional(t.String({ minLength: 2 })),
  type: t.Optional(FieldTypeEnum),
  placeholder: t.Optional(t.String()),
  helpText: t.Optional(t.String()),
  isRequired: t.Optional(t.Boolean()),
  options: t.Optional(t.Array(t.String())),
  allowMultiple: t.Optional(t.Boolean()),
  validation: t.Optional(ValidationSchema),
  fileConfig: t.Optional(FileConfigSchema),
  isActive: t.Optional(t.Boolean()),
});

export const updateResponseSchema = {
  200: t.Object({
    success: t.Literal(true),
    message: t.String(),
    data: CustomFieldSchema,
  }),
};
