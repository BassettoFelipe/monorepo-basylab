import { Elysia } from "elysia";
import { InsufficientPermissionsError, UnauthorizedError } from "@/errors";
import type { UserRole } from "@/types/roles";
import type { AuthContext } from "./auth.middleware";

/**
 * Context type for middlewares that depend on authentication
 */
type AuthenticatedContext = AuthContext & {
  params?: Record<string, string>;
  body?: unknown;
};

/**
 * Middleware to require specific roles
 * Must be used AFTER requireAuth middleware
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Elysia middleware
 *
 * @example
 * app.use(requireAuth)
 *    .use(requireRole(['owner', 'manager']))
 *    .get('/users', listUsersHandler)
 */
let roleMiddlewareCounter = 0;

export const requireRole = (allowedRoles: UserRole[]) => {
  roleMiddlewareCounter++;
  return new Elysia({
    name: `require-role-${allowedRoles.join("-")}-${roleMiddlewareCounter}`,
  }).derive({ as: "scoped" }, async (context): Promise<Record<string, never>> => {
    const { userRole } = context as unknown as AuthenticatedContext;

    if (!userRole) {
      throw new UnauthorizedError(
        "Informações de autenticação incompletas. Por favor, faça login novamente.",
      );
    }

    if (!allowedRoles.includes(userRole as UserRole)) {
      throw new InsufficientPermissionsError("Você não tem permissão para acessar este recurso.");
    }

    return {};
  });
};

/**
 * Middleware to require company association
 * Must be used AFTER requireAuth middleware
 * Ensures user belongs to a company
 *
 * @returns Elysia middleware
 *
 * @example
 * app.use(requireAuth)
 *    .use(requireCompany)
 *    .get('/properties', listPropertiesHandler)
 */
export const requireCompany = new Elysia({ name: "require-company" }).derive(
  { as: "global" },
  async (context): Promise<Record<string, never>> => {
    const { userCompanyId } = context as unknown as AuthenticatedContext;

    if (!userCompanyId) {
      throw new InsufficientPermissionsError(
        "Você precisa estar associado a uma empresa para acessar este recurso.",
      );
    }

    return {};
  },
);

/**
 * Middleware to ensure resource belongs to user's company
 * Must be used AFTER requireAuth middleware
 * Validates that a resource (identified by companyId in params/body) belongs to the authenticated user's company
 *
 * @param getResourceCompanyId - Function to extract companyId from request context
 * @returns Elysia middleware
 *
 * @example
 * // From route params
 * app.use(requireAuth)
 *    .use(requireSameCompany((ctx) => ctx.params.companyId))
 *    .get('/companies/:companyId/users', listCompanyUsersHandler)
 *
 * @example
 * // From body
 * app.use(requireAuth)
 *    .use(requireSameCompany((ctx) => ctx.body.companyId))
 *    .post('/properties', createPropertyHandler)
 */
export const requireSameCompany = (
  getResourceCompanyId: (ctx: {
    params?: Record<string, string>;
    body?: unknown;
  }) => string | null | undefined,
) => {
  return new Elysia({ name: "require-same-company" }).derive(
    { as: "global" },
    async (context): Promise<Record<string, never>> => {
      const { userCompanyId, params, body } = context as unknown as AuthenticatedContext;

      if (!userCompanyId) {
        throw new InsufficientPermissionsError(
          "Você precisa estar associado a uma empresa para acessar este recurso.",
        );
      }

      const resourceCompanyId = getResourceCompanyId({
        params: params as Record<string, string>,
        body,
      });

      if (!resourceCompanyId) {
        return {};
      }

      if (resourceCompanyId !== userCompanyId) {
        throw new InsufficientPermissionsError(
          "Você não tem permissão para acessar recursos de outra empresa.",
        );
      }

      return {};
    },
  );
};
