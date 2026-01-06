import { t } from "elysia";
import { CustomFieldSchema } from "../common-schemas";

export const listQuerySchema = t.Object({
  includeInactive: t.Optional(t.String()),
});

export const listResponseSchema = {
  200: t.Object({
    success: t.Literal(true),
    data: t.Array(CustomFieldSchema),
    hasFeature: t.Boolean(),
  }),
};
