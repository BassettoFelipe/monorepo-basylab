import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { deleteTenantParamsSchema, deleteTenantResponseSchema } from "./schema";

export const deleteTenantController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
    .delete(
      "/tenants/:id",
      async ({ validatedUser, params }) => {
        const result = await container.tenants.delete.execute({
          id: params.id,
          deletedBy: validatedUser,
        });

        return {
          success: result.success,
          message: result.message,
        };
      },
      {
        params: deleteTenantParamsSchema,
        response: {
          200: deleteTenantResponseSchema,
        },
      },
    ),
);
