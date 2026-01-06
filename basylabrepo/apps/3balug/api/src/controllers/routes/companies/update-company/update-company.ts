import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { updateCompanyBodySchema, updateCompanyResponseSchema } from "./schema";

export const updateCompanyController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER]))
    .put(
      "/companies/me",
      async ({ validatedUser, body }) => {
        const result = await container.companies.update.execute({
          updatedBy: validatedUser,
          ...body,
        });

        return {
          success: true,
          message: "Empresa atualizada com sucesso",
          data: result,
        };
      },
      {
        body: updateCompanyBodySchema,
        response: {
          200: updateCompanyResponseSchema,
        },
      },
    ),
);
