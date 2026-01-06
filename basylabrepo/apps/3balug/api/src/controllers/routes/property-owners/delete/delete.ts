import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { deletePropertyOwnerParamsSchema, deletePropertyOwnerResponseSchema } from "./schema";

export const deletePropertyOwnerController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
    .delete(
      "/property-owners/:id",
      async ({ validatedUser, params }) => {
        const result = await container.propertyOwners.delete.execute({
          id: params.id,
          deletedBy: validatedUser,
        });

        return {
          success: result.success,
          message: result.message,
        };
      },
      {
        params: deletePropertyOwnerParamsSchema,
        response: {
          200: deletePropertyOwnerResponseSchema,
        },
      },
    ),
);
