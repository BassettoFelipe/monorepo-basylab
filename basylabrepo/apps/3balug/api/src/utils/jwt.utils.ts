import jwt from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { env } from "@/config/env";

type TokenType = "access" | "refresh" | "resetPassword" | "checkout";

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  role?: string;
  companyId?: string | null;
  [key: string]: unknown;
}

export interface CheckoutTokenPayload extends JwtPayload {
  purpose: "checkout";
  user: {
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    status: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  };
}

const secrets: Record<TokenType, string> = {
  access: env.JWT_ACCESS_SECRET,
  refresh: env.JWT_REFRESH_SECRET,
  resetPassword: env.JWT_RESET_PASSWORD_SECRET,
  checkout: env.JWT_CHECKOUT_SECRET,
};

const expirations: Record<TokenType, string> = {
  access: env.JWT_ACCESS_EXPIRES_IN,
  refresh: env.JWT_REFRESH_EXPIRES_IN,
  resetPassword: env.JWT_RESET_PASSWORD_EXPIRES_IN,
  checkout: env.JWT_CHECKOUT_EXPIRES_IN,
};

function parseExpirationSeconds(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiration format: ${exp}`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * multipliers[unit];
}

function createJwtInstance(type: TokenType) {
  const app = new Elysia().use(
    jwt({
      name: "jwt",
      secret: secrets[type],
    }),
  );

  return app.decorator.jwt;
}

const jwtInstances: Record<TokenType, ReturnType<typeof createJwtInstance>> = {
  access: createJwtInstance("access"),
  refresh: createJwtInstance("refresh"),
  resetPassword: createJwtInstance("resetPassword"),
  checkout: createJwtInstance("checkout"),
};

export const JwtUtils = {
  async generateToken(
    userId: string,
    type: TokenType,
    additionalPayload?: Record<string, unknown>,
  ): Promise<string> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = parseExpirationSeconds(expirations[type]);

    const jwtInstance = jwtInstances[type];
    return jwtInstance.sign({
      sub: userId,
      exp: nowSeconds + expiresInSeconds,
      iat: true,
      ...additionalPayload,
    });
  },

  async verifyToken(token: string, type: TokenType): Promise<JwtPayload | null> {
    const jwtInstance = jwtInstances[type];
    const payload = await jwtInstance.verify(token);

    if (!payload) {
      return null;
    }

    const typedPayload = payload as unknown as JwtPayload;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (typedPayload.exp < nowSeconds) {
      return null;
    }

    return typedPayload;
  },

  parseExpirationToSeconds(exp: string): number {
    return parseExpirationSeconds(exp);
  },
};
