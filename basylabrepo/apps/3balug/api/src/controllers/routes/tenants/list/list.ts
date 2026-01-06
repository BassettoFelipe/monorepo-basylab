import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { listTenantsQuerySchema, listTenantsResponseSchema } from "./schema";

export const listTenantsController = new Elysia().guard({ as: "local" }, (app) =>
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
      "/tenants",
      async ({ validatedUser, query }) => {
        const result = await container.tenants.list.execute({
          search: query.search,
          limit: query.limit ? Number(query.limit) : undefined,
          offset: query.offset ? Number(query.offset) : undefined,
          requestedBy: validatedUser,
        });

        return {
          success: true,
          data: result.data,
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        };
      },
      {
        query: listTenantsQuerySchema,
        response: {
          200: listTenantsResponseSchema,
        },
      },
    ),
);
