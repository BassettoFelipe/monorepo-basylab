import type { UserRole } from "@/types/user.types";

/**
 * Utilitários de permissões do frontend
 * IMPORTANTE: Estas validações são apenas para UX (mostrar/esconder elementos)
 * NUNCA confie apenas no frontend - todas as permissões são validadas no backend
 */

/**
 * Verifica se o usuário pode criar novos membros da equipe
 */
export function canCreateUser(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner" || role === "manager";
}

/**
 * Verifica se o usuário pode editar membros da equipe
 */
export function canUpdateUser(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner" || role === "manager";
}

/**
 * Verifica se o usuário pode desativar membros da equipe
 */
export function canDeactivateUser(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner" || role === "manager";
}

/**
 * Verifica se o usuário pode ativar membros da equipe
 */
export function canActivateUser(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner" || role === "manager";
}

/**
 * Verifica se o usuário pode deletar membros da equipe permanentemente
 */
export function canDeleteUser(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner";
}

/**
 * Verifica se o usuário pode visualizar a lista de membros
 */
export function canListUsers(role?: UserRole): boolean {
  // Todos os usuários autenticados podem ver a lista
  return !!role;
}

/**
 * Verifica se o usuário pode editar informações da empresa
 */
export function canUpdateCompany(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner";
}

/**
 * Verifica se o usuário pode gerenciar assinatura
 */
export function canManageSubscription(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner";
}

/**
 * Verifica se o usuário pode visualizar detalhes da assinatura
 */
export function canViewSubscription(role?: UserRole): boolean {
  if (!role) return false;
  return role === "owner" || role === "manager";
}

/**
 * Retorna o nome legível do papel
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: "Proprietário",
    manager: "Gerente",
    broker: "Corretor",
    insurance_analyst: "Analista de Seguros",
    admin: "Administrador",
  };
  return labels[role] || role;
}

// Exportar também como objeto para compatibilidade com código existente
export const Permissions = {
  canCreateUser,
  canUpdateUser,
  canDeactivateUser,
  canActivateUser,
  canDeleteUser,
  canListUsers,
  canUpdateCompany,
  canManageSubscription,
  canViewSubscription,
  getRoleLabel,
};
