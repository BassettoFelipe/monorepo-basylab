import { Elysia } from "elysia";
import { customFields } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { validateUserState } from "@/controllers/middlewares/user-validation.middleware";
import { USER_ROLES } from "@/types/roles";
import { userFieldsParamsSchema, userFieldsResponseSchema } from "./schema";

export const userFieldsController = new Elysia()
  .use(requireAuth)
  .use(validateUserState)
  .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
  .get(
    "/custom-fields/user/:targetUserId",
    async ({ validatedUser, params }) => {
      const result = await customFields.getUserFields.execute({
        currentUser: validatedUser,
        targetUserId: params.targetUserId,
      });

      return {
        success: true as const,
        data: result.fields,
        user: result.user,
      };
    },
    {
      params: userFieldsParamsSchema,
      response: userFieldsResponseSchema,
    },
  );
