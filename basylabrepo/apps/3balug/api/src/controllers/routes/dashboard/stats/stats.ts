import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserStateAllowPending } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { dashboardStatsResponseSchema } from "./schema";

export const dashboardStatsController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserStateAllowPending)
    .use(
      requireRole([
        USER_ROLES.ADMIN,
        USER_ROLES.OWNER,
        USER_ROLES.MANAGER,
        USER_ROLES.BROKER,
        USER_ROLES.INSURANCE_ANALYST,
      ]),
    )
    .get(
      "/dashboard/stats",
      async ({ validatedUser }) => {
        const result = await container.dashboard.getStats.execute({
          user: validatedUser,
        });

        return {
          success: true,
          data: {
            ...result,
            contracts: {
              total: result.contracts.total,
              active: result.contracts.active,
              terminated: result.contracts.terminated,
              cancelled: result.contracts.cancelled,
              expired: result.contracts.expired,
              totalRentalAmount: result.contracts.monthlyRevenue,
            },
          },
        };
      },
      {
        response: {
          200: dashboardStatsResponseSchema,
        },
        detail: {
          summary: "Estatísticas do Dashboard",
          description: "Retorna estatísticas do dashboard baseadas no role do usuário",
          tags: ["Dashboard"],
        },
      },
    ),
);
