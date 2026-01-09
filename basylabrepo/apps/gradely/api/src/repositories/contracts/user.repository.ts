import type { NewUser, User, UserRole } from '@/db/schema/users'

export type AuthUser = {
	id: string
	email: string
	password: string | null
	name: string
	role: UserRole
	isActive: boolean
}

export type UserProfile = {
	id: string
	email: string
	name: string
	role: UserRole
	phone: string | null
	avatarUrl: string | null
	isEmailVerified: boolean
	createdAt: Date
}

export type RefreshUser = {
	id: string
	role: UserRole
	isActive: boolean
}

export type PaginationOptions = {
	page?: number
	limit?: number
}

export interface IUserRepository {
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User | null>
	findByEmailForAuth(email: string): Promise<AuthUser | null>
	findByIdForProfile(id: string): Promise<UserProfile | null>
	findByIdForRefresh(id: string): Promise<RefreshUser | null>
	create(data: NewUser): Promise<User>
	update(id: string, data: Partial<NewUser>): Promise<User | null>
	delete(id: string): Promise<boolean>
	findByRole(role: UserRole, options?: PaginationOptions): Promise<User[]>
}
