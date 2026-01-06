import type { NewCompany } from '@/db/schema/companies'
import type { NewSubscription } from '@/db/schema/subscriptions'
import type { NewUser, User } from '@/db/schema/users'

export interface IUserRepository {
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User | null>
	findByCompanyId(companyId: string): Promise<User[]>
	create(data: NewUser): Promise<User>
	update(id: string, data: Partial<NewUser>): Promise<User | null>
	delete(id: string): Promise<boolean>
	deleteByEmail(email: string): Promise<boolean>
	registerWithTransaction(params: {
		user: NewUser
		company: NewCompany
		subscription: Omit<NewSubscription, 'userId'>
	}): Promise<{
		user: User
		companyId: string
		subscriptionId: string
	}>
}
