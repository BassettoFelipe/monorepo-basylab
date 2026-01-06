import type { User } from '@/db/schema'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

type ListManagersOutput = Omit<User, 'passwordHash'>[]

export class ListManagersUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(): Promise<ListManagersOutput> {
		const managers = await this.userRepository.findManagers()

		return managers.map(({ passwordHash: _, ...manager }) => manager)
	}
}
