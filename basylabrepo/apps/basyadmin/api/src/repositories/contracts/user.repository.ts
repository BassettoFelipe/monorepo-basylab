import type { NewUser, User } from '@/db/schema'

export interface IUserRepository {
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User | null>
	findManagers(): Promise<User[]>
	create(data: NewUser): Promise<User>
	update(id: string, data: Partial<NewUser>): Promise<User | null>
	delete(id: string): Promise<boolean>
}
