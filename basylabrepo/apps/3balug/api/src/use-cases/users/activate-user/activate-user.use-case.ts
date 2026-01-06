import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IUserCacheService } from '@/services/cache'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'
import { PermissionsUtils } from '@/utils/permissions.utils'

type ActivateUserInput = {
	userId: string
	activatedBy: User
}

type ActivateUserOutput = {
	id: string
	email: string
	name: string
	isActive: boolean
	message: string
}

export class ActivateUserUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly userCacheService: IUserCacheService,
	) {}

	async execute(input: ActivateUserInput): Promise<ActivateUserOutput> {
		if (!PermissionsUtils.canActivateUser(input.activatedBy.role as UserRole)) {
			throw new ForbiddenError(
				'Você não tem permissão para ativar usuários. Apenas proprietários e gerentes podem realizar esta ação.',
			)
		}

		if (!input.activatedBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		const userToActivate = await this.userRepository.findById(input.userId)
		if (!userToActivate) {
			throw new NotFoundError('Usuário não encontrado')
		}

		if (userToActivate.companyId !== input.activatedBy.companyId) {
			throw new ForbiddenError('Você não pode ativar usuários de outra empresa')
		}

		if (userToActivate.id === input.activatedBy.id) {
			throw new ForbiddenError('Você não pode ativar sua própria conta')
		}

		if (userToActivate.role === USER_ROLES.OWNER) {
			throw new ForbiddenError('Não é possível alterar status do dono da conta')
		}

		if (userToActivate.isActive) {
			throw new BadRequestError('Este usuário já está ativo')
		}

		try {
			const updatedUser = await this.userRepository.update(input.userId, {
				isActive: true,
			})

			if (!updatedUser) {
				throw new InternalServerError('Erro ao ativar usuário')
			}

			logger.info(
				{
					userId: updatedUser.id,
					email: updatedUser.email,
					role: updatedUser.role as string,
					activatedBy: input.activatedBy.id,
				},
				'Usuário ativado com sucesso',
			)

			await this.userCacheService.invalidate(updatedUser.id)

			return {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				isActive: updatedUser.isActive,
				message: 'Usuário ativado com sucesso',
			}
		} catch (error) {
			if (error instanceof ForbiddenError || error instanceof BadRequestError) {
				throw error
			}

			logger.error(
				{
					err: error,
					userId: input.userId,
					companyId: input.activatedBy.companyId,
				},
				'Erro ao ativar usuário',
			)

			throw new InternalServerError('Erro ao ativar usuário. Tente novamente.')
		}
	}
}
