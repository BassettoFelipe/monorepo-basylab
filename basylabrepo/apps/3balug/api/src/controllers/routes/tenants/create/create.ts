import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { createTenantBodySchema, createTenantResponseSchema } from "./schema";

export const createTenantController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
    .post(
      "/tenants",
      async ({ validatedUser, body }) => {
        const result = await container.tenants.create.execute({
          ...body,
          createdBy: validatedUser,
        });

        return {
          success: true,
          message: "Locatário criado com sucesso",
          data: result,
        };
      },
      {
        body: createTenantBodySchema,
        response: {
          200: createTenantResponseSchema,
        },
      },
    ),
);
