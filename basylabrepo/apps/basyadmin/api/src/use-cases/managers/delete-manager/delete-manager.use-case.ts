import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const logger = createLogger({ service: 'delete-manager-use-case' })

type DeleteManagerInput = {
	managerId: string
}

type DeleteManagerOutput = {
	success: boolean
}

export class DeleteManagerUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: DeleteManagerInput): Promise<DeleteManagerOutput> {
		const { managerId } = input

		const manager = await this.userRepository.findById(managerId)

		if (!manager || manager.role !== 'manager') {
			throw new NotFoundError('Manager não encontrado')
		}

		try {
			const deleted = await this.userRepository.delete(managerId)

			if (!deleted) {
				throw new NotFoundError('Manager não encontrado')
			}

			logger.info({ managerId, email: manager.email }, 'Manager deletado com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao deletar manager')
			throw new InternalServerError('Erro ao deletar manager. Tente novamente.')
		}
	}
}
