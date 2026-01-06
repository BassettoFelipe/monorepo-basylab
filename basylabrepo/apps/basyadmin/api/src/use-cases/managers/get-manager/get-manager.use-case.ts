import { NotFoundError } from '@basylab/core/errors'
import type { User } from '@/db/schema'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

type GetManagerInput = {
	managerId: string
}

type GetManagerOutput = Omit<User, 'passwordHash'>

export class GetManagerUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: GetManagerInput): Promise<GetManagerOutput> {
		const { managerId } = input

		const manager = await this.userRepository.findById(managerId)

		if (!manager || manager.role !== 'manager') {
			throw new NotFoundError('Manager não encontrado')
		}

		const { passwordHash: _, ...managerWithoutPassword } = manager
		return managerWithoutPassword
	}
}
