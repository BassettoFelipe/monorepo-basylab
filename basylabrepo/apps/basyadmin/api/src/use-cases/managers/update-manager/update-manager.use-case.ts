import { PasswordUtils } from '@basylab/core/crypto'
import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { User } from '@/db/schema'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const logger = createLogger({ service: 'update-manager-use-case' })

type UpdateManagerInput = {
	managerId: string
	email?: string
	name?: string
	password?: string
	isActive?: boolean
}

type UpdateManagerOutput = Omit<User, 'passwordHash'>

export class UpdateManagerUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: UpdateManagerInput): Promise<UpdateManagerOutput> {
		const { managerId, email, name, password, isActive } = input

		const manager = await this.userRepository.findById(managerId)

		if (!manager || manager.role !== 'manager') {
			throw new NotFoundError('Manager não encontrado')
		}

		if (email && email !== manager.email) {
			const normalizedEmail = email.toLowerCase().trim()
			const existingUser = await this.userRepository.findByEmail(normalizedEmail)
			if (existingUser) {
				throw new ConflictError('Email já está em uso')
			}
		}

		if (password && password.length < 6) {
			throw new BadRequestError('Senha deve ter pelo menos 6 caracteres')
		}

		try {
			const updateData: Record<string, unknown> = {}

			if (name !== undefined) updateData.name = name.trim()
			if (email !== undefined) updateData.email = email.toLowerCase().trim()
			if (isActive !== undefined) updateData.isActive = isActive

			if (password) {
				updateData.passwordHash = await PasswordUtils.hash(password)
			}

			const updatedManager = await this.userRepository.update(managerId, updateData)

			if (!updatedManager) {
				throw new NotFoundError('Manager não encontrado')
			}

			logger.info({ userId: updatedManager.id }, 'Manager atualizado com sucesso')

			const { passwordHash: _, ...managerWithoutPassword } = updatedManager
			return managerWithoutPassword
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar manager')
			throw new InternalServerError('Erro ao atualizar manager. Tente novamente.')
		}
	}
}
