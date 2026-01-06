import { Elysia } from "elysia";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { auth } from "@/container";
import { bruteForcePlugin } from "@/plugins/brute-force.plugin";
import { loginRateLimitPlugin } from "@/plugins/rate-limit.plugin";
import { loginBodySchema, loginResponseSchema } from "./schema";

export const loginController = new Elysia()
  .use(loginRateLimitPlugin)
  .use(bruteForcePlugin)
  .post(
    "/auth/login",
    async (context) => {
      const {
        body,
        set,
        cookie: { refreshToken },
        bruteForce,
        request,
      } = context;
      const ip = bruteForce.getClientIp(request);
      const email = body.email;

      const blockCheck = bruteForce.protection.isBlocked(ip, email);
      if (blockCheck.blocked) {
        const retryAt = blockCheck.retryAt?.toISOString() || new Date().toISOString();
        const remainingMinutes = blockCheck.retryAt
          ? Math.ceil((blockCheck.retryAt.getTime() - Date.now()) / 60000)
          : 0;

        logger.warn(
          {
            event: "LOGIN_BLOCKED",
            ip,
            email,
            reason: blockCheck.reason,
            blockedUntil: blockCheck.blockedUntil,
            retryAt,
          },
          `Login blocked for ${email} from ${ip} - ${blockCheck.reason}`,
        );

        set.status = 429;
        return {
          success: false,
          message: `Muitas tentativas de login. Por favor, aguarde ${remainingMinutes} minutos antes de tentar novamente.`,
          type: "TOO_MANY_ATTEMPTS",
          retryAt,
        };
      }

      try {
        const result = await auth.login.execute(body);

        bruteForce.protection.registerSuccessfulAttempt(ip, email);

        logger.info(
          {
            event: "LOGIN_SUCCESS",
            userId: result.user.id,
            email: result.user.email,
            ip,
            subscriptionStatus: result.subscription.status,
          },
          `Successful login for ${result.user.email} from ${ip}`,
        );

        refreshToken.set({
          value: result.refreshToken,
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        set.status = 200;
        return {
          success: true,
          message: "Login realizado com sucesso",
          data: {
            user: result.user,
            subscription: result.subscription,
            accessToken: result.accessToken,
            checkoutToken: result.checkoutToken,
            checkoutExpiresAt: result.checkoutExpiresAt,
          },
        };
      } catch (error) {
        bruteForce.protection.registerFailedAttempt(ip, email);

        const remainingAttempts = bruteForce.protection.getRemainingAttempts(ip, email);

        logger.warn(
          {
            event: "LOGIN_FAILED",
            email,
            ip,
            error: error instanceof Error ? error.message : "Unknown error",
            remainingAttempts,
          },
          `Failed login attempt for ${email} from ${ip} - ${remainingAttempts} attempts remaining`,
        );

        throw error;
      }
    },
    {
      body: loginBodySchema,
      response: loginResponseSchema,
    },
  );
