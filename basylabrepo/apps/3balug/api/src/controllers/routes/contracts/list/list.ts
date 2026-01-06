import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { listContractsQuerySchema, listContractsResponseSchema } from "./schema";

export const listContractsController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
    .get(
      "/contracts",
      async ({ validatedUser, query }) => {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;

        const result = await container.contracts.list.execute({
          limit,
          offset,
          status: query.status,
          propertyId: query.propertyId,
          tenantId: query.tenantId,
          ownerId: query.ownerId,
          requestedBy: validatedUser,
        });

        const totalPages = Math.ceil(result.total / limit);

        return {
          success: true,
          data: result.data,
          pagination: {
            page,
            limit: result.limit,
            total: result.total,
            totalPages,
          },
        };
      },
      {
        query: listContractsQuerySchema,
        response: {
          200: listContractsResponseSchema,
        },
        detail: {
          summary: "Listar contratos",
          description: "Lista contratos de locação com paginação e filtros",
          tags: ["Contratos"],
        },
      },
    ),
);
