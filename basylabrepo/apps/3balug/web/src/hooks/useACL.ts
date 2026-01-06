import { useUser } from '@/queries/auth/useUser'
import type { UserRole } from '@/types/user.types'
import { storage } from '@/utils/storage'

interface ACLHook {
	userRole: UserRole | null
	isOwner: boolean
	isManager: boolean
	isBroker: boolean
	isAnalyst: boolean
	isAdmin: boolean
	hasRole: (roles: UserRole | UserRole[]) => boolean
	canManageUsers: boolean
	canViewUsers: boolean
	isLoading: boolean
}

export function useACL(): ACLHook {
	const { user, isLoading } = useUser()

	// Usa cache do localStorage se disponível, enquanto a query carrega
	const cachedRole = storage.getUserRole() as UserRole | null
	const userRole = user ? user.role : cachedRole

	const isOwner = userRole === 'owner'
	const isManager = userRole === 'manager'
	const isBroker = userRole === 'broker'
	const isAnalyst = userRole === 'insurance_analyst'
	const isAdmin = userRole === 'admin'

	const hasRole = (roles: UserRole | UserRole[]): boolean => {
		if (!userRole) return false
		const allowedRoles = Array.isArray(roles) ? roles : [roles]
		return allowedRoles.includes(userRole)
	}

	// Permissões específicas
	const canManageUsers = isOwner || isManager || isAdmin // Criar, editar, desativar usuários
	const canViewUsers = isOwner || isManager || isAdmin // Listar usuários

	return {
		userRole,
		isOwner,
		isManager,
		isBroker,
		isAnalyst,
		isAdmin,
		hasRole,
		canManageUsers,
		canViewUsers,
		isLoading,
	}
}
