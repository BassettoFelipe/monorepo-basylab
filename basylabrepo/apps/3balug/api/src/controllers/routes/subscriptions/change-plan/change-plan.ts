import { Elysia } from "elysia";
import { container } from "@/container";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserStateAllowPending } from "@/controllers/middlewares/user-validation.middleware";
import { changePlanBodySchema, changePlanResponseSchema } from "./schema";

export const changePlanController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserStateAllowPending)
    .patch(
      "/subscriptions/change-plan",
      async ({ body, validatedUser }) => {
        const result = await container.subscriptions.changePlan.execute({
          user: validatedUser,
          planId: body.planId,
        });

        return result;
      },
      {
        body: changePlanBodySchema,
        response: changePlanResponseSchema,
      },
    ),
);
