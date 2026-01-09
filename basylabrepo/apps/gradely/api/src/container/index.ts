import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { createAuthUseCases } from './modules/auth.module'
import { repositories } from './modules/repositories'

export const auth = createAuthUseCases()

export const container = {
	...repositories,
	auth,
}

export function injectTestRepositories(repos: { userRepository?: IUserRepository }): void {
	if (repos.userRepository) {
		Object.assign(repositories, { userRepository: repos.userRepository })
	}

	Object.assign(auth, createAuthUseCases())
}

export type Container = typeof container
