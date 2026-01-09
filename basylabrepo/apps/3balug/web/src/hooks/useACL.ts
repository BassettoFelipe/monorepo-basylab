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
	// Permissões de usuários
	canManageUsers: boolean
	canViewUsers: boolean
	// Permissões de imóveis
	canViewProperties: boolean
	canCreateProperty: boolean
	canEditProperty: boolean
	canDeleteProperty: boolean
	// Permissões de proprietários
	canViewPropertyOwners: boolean
	canCreatePropertyOwner: boolean
	canEditPropertyOwner: boolean
	canDeletePropertyOwner: boolean
	// Permissões de contratos
	canViewContracts: boolean
	canCreateContract: boolean
	canEditContract: boolean
	canTerminateContract: boolean
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

	// Permissões de usuários
	const canManageUsers = isOwner || isManager || isAdmin
	const canViewUsers = isOwner || isManager || isAdmin

	// Permissões de imóveis
	const canViewProperties = isOwner || isManager || isBroker || isAdmin
	const canCreateProperty = isOwner || isManager || isBroker || isAdmin
	const canEditProperty = isOwner || isManager || isBroker || isAdmin
	const canDeleteProperty = isOwner || isManager || isAdmin // Broker não pode deletar

	// Permissões de proprietários
	const canViewPropertyOwners = isOwner || isManager || isBroker || isAdmin
	const canCreatePropertyOwner = isOwner || isManager || isBroker || isAdmin
	const canEditPropertyOwner = isOwner || isManager || isBroker || isAdmin
	const canDeletePropertyOwner = isOwner || isManager || isAdmin // Broker não pode deletar

	// Permissões de contratos
	const canViewContracts = isOwner || isManager || isBroker || isAnalyst || isAdmin
	const canCreateContract = isOwner || isManager || isBroker || isAdmin
	const canEditContract = isOwner || isManager || isAdmin
	const canTerminateContract = isOwner || isManager || isAdmin

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
		canViewProperties,
		canCreateProperty,
		canEditProperty,
		canDeleteProperty,
		canViewPropertyOwners,
		canCreatePropertyOwner,
		canEditPropertyOwner,
		canDeletePropertyOwner,
		canViewContracts,
		canCreateContract,
		canEditContract,
		canTerminateContract,
		isLoading,
	}
}
