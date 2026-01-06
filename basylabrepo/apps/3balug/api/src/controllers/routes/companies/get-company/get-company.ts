import { Elysia } from "elysia";
import { container } from "@/container";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { getCompanyResponseSchema } from "./schema";

export const getCompanyController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .get(
      "/companies/me",
      async ({ validatedUser }) => {
        const result = await container.companies.get.execute({
          requestedBy: validatedUser,
        });

        return {
          success: true,
          data: result,
        };
      },
      {
        response: {
          200: getCompanyResponseSchema,
        },
      },
    ),
);
