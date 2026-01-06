import { Navigate } from "react-router-dom";
import type { UserRole } from "@/types/user.types";
import { storage } from "@/utils/storage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Proteção de rotas baseada em roles do localStorage.
 *
 * Lógica:
 * 1. Usa role do localStorage para decisão instantânea (sem loading)
 * 2. Se não tem role no cache, permite acesso (será validado pela API)
 * 3. Se token inválido, interceptor do axios faz logout
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) {
  const cachedRole = storage.getUserRole() as UserRole | null;

  // Se tem role no cache e não tem permissão, redireciona
  if (cachedRole && !requiredRoles.includes(cachedRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Se não tem cache ou tem permissão, renderiza
  // A validação real acontece via useUser() no componente filho
  return <>{children}</>;
}
