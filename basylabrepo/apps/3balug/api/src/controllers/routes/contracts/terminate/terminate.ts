import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import {
  terminateContractBodySchema,
  terminateContractParamsSchema,
  terminateContractResponseSchema,
} from "./schema";

export const terminateContractController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
    .post(
      "/contracts/:id/terminate",
      async ({ validatedUser, params, body }) => {
        const result = await container.contracts.terminate.execute({
          id: params.id,
          reason: body.reason,
          terminatedBy: validatedUser,
        });

        return {
          success: true,
          message: "Contrato encerrado com sucesso",
          data: result,
        };
      },
      {
        params: terminateContractParamsSchema,
        body: terminateContractBodySchema,
        response: {
          200: terminateContractResponseSchema,
        },
        detail: {
          summary: "Encerrar contrato",
          description: "Encerra um contrato de locação ativo",
          tags: ["Contratos"],
        },
      },
    ),
);
