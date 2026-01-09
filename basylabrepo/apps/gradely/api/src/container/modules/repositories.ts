import { db } from '@/db'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { DrizzleUserRepository } from '@/repositories/providers/drizzle/user.repository'

export interface Repositories {
	userRepository: IUserRepository
}

export const repositories: Repositories = {
	userRepository: new DrizzleUserRepository(db),
}
