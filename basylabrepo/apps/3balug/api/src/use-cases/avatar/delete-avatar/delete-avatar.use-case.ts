import { StorageUrlUtils } from '@basylab/core'
import { BadRequestError } from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IStorageService } from '@/services/storage'

type DeleteAvatarInput = {
	userId: string
}

export class DeleteAvatarUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly storageService: IStorageService,
	) {}

	async execute(input: DeleteAvatarInput): Promise<void> {
		const { userId } = input

		const user = await this.userRepository.findById(userId)
		if (!user) {
			throw new BadRequestError('Usuário não encontrado.')
		}

		if (!user.avatarUrl) {
			return // Nada a fazer
		}

		// Extrair key do URL e remover do storage
		try {
			const key = StorageUrlUtils.extractS3Key(user.avatarUrl)
			if (key) {
				await this.storageService.delete(key)
			}
		} catch (error) {
			logger.warn(
				{ err: error, userId, avatarUrl: user.avatarUrl },
				'Não foi possível remover avatar do storage',
			)
		}

		await this.userRepository.update(userId, {
			avatarUrl: null,
		})

		logger.info({ userId }, 'Avatar removido com sucesso')
	}
}
