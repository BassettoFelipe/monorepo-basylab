import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { createPropertyBodySchema, createPropertyResponseSchema } from "./schema";

export const createPropertyController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
    .post(
      "/properties",
      async ({ validatedUser, body }) => {
        const result = await container.properties.create.execute({
          ...body,
          createdBy: validatedUser,
        });

        return {
          success: true,
          message: "Imóvel criado com sucesso",
          data: result,
        };
      },
      {
        body: createPropertyBodySchema,
        response: {
          200: createPropertyResponseSchema,
        },
      },
    ),
);
