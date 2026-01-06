import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import {
  updatePropertyOwnerBodySchema,
  updatePropertyOwnerParamsSchema,
  updatePropertyOwnerResponseSchema,
} from "./schema";

export const updatePropertyOwnerController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
    .patch(
      "/property-owners/:id",
      async ({ validatedUser, params, body }) => {
        const result = await container.propertyOwners.update.execute({
          id: params.id,
          ...body,
          updatedBy: validatedUser,
        });

        return {
          success: true,
          message: "Proprietário atualizado com sucesso",
          data: result,
        };
      },
      {
        params: updatePropertyOwnerParamsSchema,
        body: updatePropertyOwnerBodySchema,
        response: {
          200: updatePropertyOwnerResponseSchema,
        },
      },
    ),
);
