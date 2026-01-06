import { Elysia } from "elysia";
import { auth } from "@/container";
import { validateEmailForResetBodySchema, validateEmailForResetResponseSchema } from "./schema";

export const validateEmailForResetController = new Elysia().post(
  "/auth/validate-email-for-reset",
  async ({ body }) => {
    const result = await auth.validateEmailForReset.execute(body);

    return {
      email: result.email,
    };
  },
  {
    body: validateEmailForResetBodySchema,
    response: validateEmailForResetResponseSchema,
    detail: {
      tags: ["Auth"],
      summary: "Validate email for password reset",
      description:
        "Validates if email exists and is verified before proceeding to password reset flow. Does not send any email.",
    },
  },
);
