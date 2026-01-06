import type { Subscription } from './subscription.types'

export type UserRole = 'admin' | 'owner' | 'broker' | 'manager' | 'insurance_analyst'

export interface User {
	id: string
	email: string
	name: string
	role: UserRole
	phone: string | null
	avatarUrl: string | null
	companyId: string | null
	createdBy: string | null
	isActive: boolean
	isEmailVerified: boolean
	createdAt: string
	updatedAt: string
	hasPendingCustomFields: boolean
	subscription: Subscription | null
}

// Tipos para gestão de usuários (team management)
export interface TeamUser {
	id: string
	email: string
	name: string
	role: UserRole
	phone: string | null
	avatarUrl: string | null
	companyId: string | null
	isActive: boolean
	isEmailVerified: boolean
	hasPendingCustomFields: boolean
	createdAt: string // Exibido como "Data de Cadastro" na listagem
}

export interface CustomFieldValue {
	fieldId: string
	value: string
}

export interface CreateUserInput {
	email: string
	name: string
	role: 'broker' | 'manager' | 'insurance_analyst'
	phone: string
	customFields?: CustomFieldValue[]
}

export interface UpdateUserInput {
	name?: string
	email?: string
	role?: 'broker' | 'manager' | 'insurance_analyst'
	phone?: string
	isActive?: boolean
}

export interface ListUsersParams {
	role?: 'broker' | 'manager' | 'insurance_analyst' | 'all'
	isActive?: boolean
	page?: number
	limit?: number
}

export interface ListUsersResponse {
	users: TeamUser[]
	total: number
	page: number
	limit: number
	totalPages: number
}
