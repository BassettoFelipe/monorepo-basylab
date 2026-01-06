import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'
import { PermissionsUtils } from '@/utils/permissions.utils'

type DeleteUserInput = {
	userId: string // ID do usuário a ser deletado
	deletedBy: User // Usuário que está deletando (deve ser owner)
}

type DeleteUserOutput = {
	id: string
	email: string
	name: string
	message: string
}

export class DeleteUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: DeleteUserInput): Promise<DeleteUserOutput> {
		if (!PermissionsUtils.canDeleteUser(input.deletedBy.role as UserRole)) {
			throw new ForbiddenError(
				'Você não tem permissão para deletar usuários. Apenas o proprietário pode realizar esta ação.',
			)
		}

		if (!input.deletedBy.companyId) {
			throw new InternalServerError('Usuário owner sem empresa vinculada')
		}

		const userToDelete = await this.userRepository.findById(input.userId)
		if (!userToDelete) {
			throw new NotFoundError('Usuário não encontrado')
		}

		if (userToDelete.companyId !== input.deletedBy.companyId) {
			throw new ForbiddenError('Você não pode deletar usuários de outra empresa')
		}

		if (userToDelete.role === USER_ROLES.OWNER) {
			throw new ForbiddenError('Não é possível deletar o dono da conta')
		}

		if (userToDelete.id === input.deletedBy.id) {
			throw new BadRequestError('Você não pode deletar a si mesmo')
		}

		try {
			const deleted = await this.userRepository.delete(input.userId)

			if (!deleted) {
				throw new InternalServerError('Erro ao deletar usuário')
			}

			logger.info(
				{
					userId: userToDelete.id,
					email: userToDelete.email,
					role: userToDelete.role,
					deletedBy: input.deletedBy.id,
				},
				'Usuário deletado permanentemente',
			)

			return {
				id: userToDelete.id,
				email: userToDelete.email,
				name: userToDelete.name,
				message: 'Usuário deletado permanentemente com sucesso',
			}
		} catch (error) {
			if (
				error instanceof ForbiddenError ||
				error instanceof BadRequestError ||
				error instanceof NotFoundError
			) {
				throw error
			}

			logger.error(
				{
					err: error,
					userId: input.userId,
					companyId: input.deletedBy.companyId,
				},
				'Erro ao deletar usuário',
			)

			throw new InternalServerError('Erro ao deletar usuário. Tente novamente.')
		}
	}
}
