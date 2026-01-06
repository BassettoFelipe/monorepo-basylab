import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { deletePropertyParamsSchema, deletePropertyResponseSchema } from "./schema";

export const deletePropertyController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
    .delete(
      "/properties/:id",
      async ({ validatedUser, params }) => {
        const result = await container.properties.delete.execute({
          id: params.id,
          deletedBy: validatedUser,
        });

        return {
          success: result.success,
          message: result.message,
        };
      },
      {
        params: deletePropertyParamsSchema,
        response: {
          200: deletePropertyResponseSchema,
        },
      },
    ),
);
