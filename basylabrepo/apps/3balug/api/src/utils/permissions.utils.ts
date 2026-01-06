import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

/**
 * Permissões do sistema por papel (role)
 *
 * Hierarquia:
 * - OWNER: Acesso total ao sistema
 * - MANAGER: Pode gerenciar equipe (exceto deletar), sem acesso a empresa e assinatura
 * - BROKER/INSURANCE_ANALYST: Apenas operacional, sem gestão
 */
export const PermissionsUtils = {
  /**
   * Verifica se o usuário pode criar novos membros da equipe
   */
  canCreateUser(role: UserRole): boolean {
    return role === USER_ROLES.OWNER || role === USER_ROLES.MANAGER;
  },

  /**
   * Verifica se o usuário pode editar membros da equipe
   */
  canUpdateUser(role: UserRole): boolean {
    return role === USER_ROLES.OWNER || role === USER_ROLES.MANAGER;
  },

  /**
   * Verifica se o usuário pode desativar membros da equipe
   */
  canDeactivateUser(role: UserRole): boolean {
    return role === USER_ROLES.OWNER || role === USER_ROLES.MANAGER;
  },

  /**
   * Verifica se o usuário pode ativar membros da equipe
   */
  canActivateUser(role: UserRole): boolean {
    return role === USER_ROLES.OWNER || role === USER_ROLES.MANAGER;
  },

  /**
   * Verifica se o usuário pode deletar membros da equipe permanentemente
   */
  canDeleteUser(role: UserRole): boolean {
    return role === USER_ROLES.OWNER;
  },

  /**
   * Verifica se o usuário pode listar membros da equipe
   */
  canListUsers(_role: UserRole): boolean {
    // Todos podem ver a lista da equipe
    return true;
  },

  /**
   * Verifica se o usuário pode editar informações da empresa
   */
  canUpdateCompany(role: UserRole): boolean {
    return role === USER_ROLES.OWNER;
  },

  /**
   * Verifica se o usuário pode gerenciar assinatura
   */
  canManageSubscription(role: UserRole): boolean {
    return role === USER_ROLES.OWNER;
  },

  /**
   * Verifica se o usuário pode visualizar detalhes da assinatura
   */
  canViewSubscription(role: UserRole): boolean {
    // Owner e Manager podem ver detalhes da assinatura
    return role === USER_ROLES.OWNER || role === USER_ROLES.MANAGER;
  },

  /**
   * Retorna uma descrição legível do papel
   */
  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      owner: "Proprietário",
      manager: "Gerente",
      broker: "Corretor",
      insurance_analyst: "Analista de Seguros",
      admin: "Administrador",
    };
    return labels[role] || role;
  },
};
