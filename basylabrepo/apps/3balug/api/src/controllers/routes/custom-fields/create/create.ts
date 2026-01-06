import { Elysia } from "elysia";
import { customFields } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { createBodySchema, createResponseSchema } from "./schema";

export const createCustomFieldController = new Elysia()
  .use(requireAuth)
  .use(validateUserState)
  .use(requireRole([USER_ROLES.OWNER]))
  .post(
    "/custom-fields",
    async ({ validatedUser, body }) => {
      const field = await customFields.create.execute({
        user: validatedUser,
        ...body,
      });

      return {
        success: true as const,
        message: "Campo criado com sucesso",
        data: field,
      };
    },
    {
      body: createBodySchema,
      response: createResponseSchema,
    },
  );
