import { Elysia } from "elysia";
import { auth } from "@/container";
import { registerBodySchema, registerResponseSchema } from "./schema";

export const registerController = new Elysia().post(
  "/auth/register",
  async ({ body, set }) => {
    const result = await auth.register.execute(body);

    set.status = 201;
    return {
      success: true,
      message: result.message,
      data: {
        user: {
          email: result.email,
          name: result.name,
        },
      },
    };
  },
  {
    body: registerBodySchema,
    response: registerResponseSchema,
  },
);
