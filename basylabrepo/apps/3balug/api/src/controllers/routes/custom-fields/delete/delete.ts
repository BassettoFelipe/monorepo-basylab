import { Elysia } from "elysia";
import { customFields } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { deleteParamsSchema, deleteResponseSchema } from "./schema";

export const deleteCustomFieldController = new Elysia()
  .use(requireAuth)
  .use(validateUserState)
  .use(requireRole([USER_ROLES.OWNER]))
  .delete(
    "/custom-fields/:id",
    async ({ validatedUser, params }) => {
      await customFields.delete.execute({
        user: validatedUser,
        fieldId: params.id,
      });

      return {
        success: true as const,
        message: "Campo excluído com sucesso",
      };
    },
    {
      params: deleteParamsSchema,
      response: deleteResponseSchema,
    },
  );
