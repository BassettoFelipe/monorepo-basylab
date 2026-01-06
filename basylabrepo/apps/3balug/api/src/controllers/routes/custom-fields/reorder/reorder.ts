import { Elysia } from "elysia";
import { customFields } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { reorderBodySchema, reorderResponseSchema } from "./schema";

export const reorderCustomFieldsController = new Elysia()
  .use(requireAuth)
  .use(validateUserState)
  .use(requireRole([USER_ROLES.OWNER]))
  .post(
    "/custom-fields/reorder",
    async ({ validatedUser, body }) => {
      await customFields.reorder.execute({
        user: validatedUser,
        fieldIds: body.fieldIds,
      });

      return {
        success: true as const,
        message: "Campos reordenados com sucesso",
      };
    },
    {
      body: reorderBodySchema,
      response: reorderResponseSchema,
    },
  );
