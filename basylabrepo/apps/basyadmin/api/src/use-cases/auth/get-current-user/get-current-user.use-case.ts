import { UnauthorizedError } from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

type GetCurrentUserInput = {
	userId: string
}

type GetCurrentUserOutput = {
	id: string
	email: string
	name: string
	role: 'owner' | 'manager'
	isActive: boolean | null
	createdAt: Date | null
}

export class GetCurrentUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
		const { userId } = input

		const user = await this.userRepository.findById(userId)

		if (!user) {
			throw new UnauthorizedError('Usuário não encontrado')
		}

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			isActive: user.isActive,
			createdAt: user.createdAt,
		}
	}
}
