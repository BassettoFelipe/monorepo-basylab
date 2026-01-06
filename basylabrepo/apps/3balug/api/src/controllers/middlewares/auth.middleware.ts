import {
  AuthenticationRequiredError,
  InvalidTokenError,
  TokenExpiredError,
} from "@basylab/core/errors";
import { Elysia } from "elysia";
import { JwtUtils } from "@/utils/jwt.utils";

/**
 * Token payload structure from JWT verification
 */
export interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  role?: string;
  companyId?: string | null;
  [key: string]: unknown;
}

/**
 * Context derived from authentication middleware
 */
export interface AuthContext {
  userId: string;
  userRole: string | null;
  userCompanyId: string | null;
  tokenPayload: TokenPayload;
  [key: string]: unknown;
}

/**
 * Parses the Authorization header and extracts the Bearer token
 * @returns The token string or null if invalid format
 */
function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return null;
  }

  return parts[1];
}

/**
 * Creates the auth context from a valid token payload
 */
function createAuthContext(payload: TokenPayload): AuthContext {
  return {
    userId: payload.sub,
    userRole: payload.role ?? null,
    userCompanyId: payload.companyId ?? null,
    tokenPayload: payload,
  };
}

/**
 * Authentication middleware that validates JWT tokens
 * Derives user information from the token and makes it available to route handlers
 *
 * @example
 * app.use(requireAuth)
 *    .get('/profile', ({ userId }) => getUserProfile(userId))
 */
export const requireAuth = new Elysia({ name: "auth-middleware" }).derive(
  { as: "scoped" },
  async ({ headers }): Promise<AuthContext> => {
    const token = extractBearerToken(headers.authorization);

    if (!token) {
      if (!headers.authorization) {
        throw new AuthenticationRequiredError();
      }
      throw new InvalidTokenError("Token de autenticação inválido");
    }

    const payload = await JwtUtils.verifyToken(token, "access");

    if (!payload) {
      throw new TokenExpiredError("Sua sessão expirou. Por favor, faça login novamente");
    }

    return createAuthContext(payload);
  },
);

/**
 * Factory function to create auth middleware with custom token verifier
 * Use this in tests to inject mock verifier without global mocking
 */
export const createAuthMiddleware = (
  verifyToken: (
    token: string,
    type: "access",
  ) => Promise<TokenPayload | null> = JwtUtils.verifyToken,
) =>
  new Elysia({ name: "auth-middleware" }).derive(
    { as: "scoped" },
    async ({ headers }): Promise<AuthContext> => {
      const token = extractBearerToken(headers.authorization);

      if (!token) {
        if (!headers.authorization) {
          throw new AuthenticationRequiredError();
        }
        throw new InvalidTokenError("Token de autenticação inválido");
      }

      const payload = await verifyToken(token, "access");

      if (!payload) {
        throw new TokenExpiredError("Sua sessão expirou. Por favor, faça login novamente");
      }

      return createAuthContext(payload);
    },
  );
