import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { getContractParamsSchema, getContractResponseSchema } from "./schema";

export const getContractController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
    .get(
      "/contracts/:id",
      async ({ validatedUser, params }) => {
        const result = await container.contracts.get.execute({
          id: params.id,
          requestedBy: validatedUser,
        });

        return {
          success: true,
          data: result,
        };
      },
      {
        params: getContractParamsSchema,
        response: {
          200: getContractResponseSchema,
        },
        detail: {
          summary: "Buscar contrato",
          description: "Busca um contrato de locação pelo ID",
          tags: ["Contratos"],
        },
      },
    ),
);
