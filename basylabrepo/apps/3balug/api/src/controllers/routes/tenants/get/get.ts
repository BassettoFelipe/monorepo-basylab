import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { getTenantParamsSchema, getTenantResponseSchema } from "./schema";

export const getTenantController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(
      requireRole([
        USER_ROLES.OWNER,
        USER_ROLES.MANAGER,
        USER_ROLES.BROKER,
        USER_ROLES.INSURANCE_ANALYST,
      ]),
    )
    .get(
      "/tenants/:id",
      async ({ validatedUser, params }) => {
        const result = await container.tenants.get.execute({
          id: params.id,
          requestedBy: validatedUser,
        });

        return {
          success: true,
          data: result,
        };
      },
      {
        params: getTenantParamsSchema,
        response: {
          200: getTenantResponseSchema,
        },
      },
    ),
);
