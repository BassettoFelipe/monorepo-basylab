import { Elysia } from "elysia";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

export const loggerPlugin = new Elysia({ name: "logger" })
  .onRequest(({ request }) => {
    if (env.NODE_ENV === "development") {
      logger.info(
        {
          method: request.method,
          url: request.url,
        },
        `${request.method} ${new URL(request.url).pathname}`,
      );
    }
  })
  .onAfterResponse(({ request, set }) => {
    if (env.NODE_ENV === "development") {
      logger.info(
        {
          method: request.method,
          url: request.url,
          status: set.status,
        },
        `${request.method} ${new URL(request.url).pathname} - ${set.status}`,
      );
    }
  });
