import {
	BadRequestError,
	EmailAlreadyExistsError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
	PlanLimitExceededError,
} from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IUserCacheService } from '@/services/cache'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'
import { PermissionsUtils } from '@/utils/permissions.utils'

type UpdateUserInput = {
	userId: string // ID do usuário a ser atualizado
	updatedBy: User // Usuário que está atualizando (deve ser owner ou manager)
	name?: string
	email?: string
	role?: UserRole
	phone?: string
	isActive?: boolean
}

type UpdateUserOutput = {
	id: string
	email: string
	name: string
	role: string
	companyId: string | null
	isActive: boolean
}

export class UpdateUserUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly planRepository: IPlanRepository,
		private readonly userCacheService: IUserCacheService,
	) {}

	async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
		if (!PermissionsUtils.canUpdateUser(input.updatedBy.role as UserRole)) {
			throw new ForbiddenError(
				'Você não tem permissão para editar usuários. Apenas proprietários e gerentes podem realizar esta ação.',
			)
		}

		if (!input.updatedBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		const userToUpdate = await this.userRepository.findById(input.userId)
		if (!userToUpdate) {
			throw new NotFoundError('Usuário não encontrado')
		}

		if (userToUpdate.companyId !== input.updatedBy.companyId) {
			throw new ForbiddenError('Você não pode editar usuários de outra empresa')
		}

		if (userToUpdate.id === input.updatedBy.id) {
			throw new ForbiddenError(
				'Você não pode editar sua própria conta por aqui. Use a página de perfil.',
			)
		}

		if (userToUpdate.role === USER_ROLES.OWNER) {
			throw new ForbiddenError('Não é possível editar o dono da conta')
		}

		if (input.role === USER_ROLES.MANAGER && userToUpdate.role !== USER_ROLES.MANAGER) {
			const subscription = await this.subscriptionRepository.findActiveByUserId(input.updatedBy.id)
			if (!subscription) {
				throw new ForbiddenError('Assinatura inativa')
			}

			const plan = await this.planRepository.findById(subscription.planId)
			if (!plan) {
				throw new InternalServerError('Plano não encontrado')
			}

			const existingUsers = await this.userRepository.findByCompanyId(input.updatedBy.companyId)
			const managers = existingUsers.filter(
				(u) => u.role === USER_ROLES.MANAGER && u.isActive && u.id !== input.userId,
			)

			if (managers.length >= plan.maxManagers) {
				throw new PlanLimitExceededError(
					`Seu plano permite no máximo ${plan.maxManagers} gerente(s)`,
				)
			}
		}

		if (input.phone) {
			const normalizedPhone = input.phone.replace(/\D/g, '')
			if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
				throw new BadRequestError('Formato de celular inválido. Use o formato: (11) 99999-9999')
			}
		}

		if (input.email) {
			const normalizedEmail = input.email.toLowerCase().trim()
			if (normalizedEmail !== userToUpdate.email) {
				const existingUser = await this.userRepository.findByEmail(normalizedEmail)
				if (existingUser) {
					throw new EmailAlreadyExistsError()
				}
			}
		}

		try {
			const updateData: Partial<User> = {}

			if (input.name) updateData.name = input.name
			if (input.email) updateData.email = input.email.toLowerCase().trim()
			if (input.role) updateData.role = input.role
			if (input.phone !== undefined)
				updateData.phone = input.phone ? input.phone.replace(/\D/g, '') : null
			if (input.isActive !== undefined) updateData.isActive = input.isActive

			const updatedUser = await this.userRepository.update(input.userId, updateData)

			if (!updatedUser) {
				throw new InternalServerError('Erro ao atualizar usuário')
			}

			logger.info(
				{
					userId: updatedUser.id,
					email: updatedUser.email,
					role: updatedUser.role,
					updatedBy: input.updatedBy.id,
					changes: updateData,
				},
				'Usuário atualizado com sucesso',
			)

			// Invalidar cache do usuário
			await this.userCacheService.invalidate(updatedUser.id)

			return {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				role: updatedUser.role,
				companyId: updatedUser.companyId,
				isActive: updatedUser.isActive,
			}
		} catch (error) {
			if (
				error instanceof ForbiddenError ||
				error instanceof EmailAlreadyExistsError ||
				error instanceof PlanLimitExceededError
			) {
				throw error
			}

			logger.error(
				{
					err: error,
					userId: input.userId,
					companyId: input.updatedBy.companyId,
				},
				'Erro ao atualizar usuário',
			)

			throw new InternalServerError('Erro ao atualizar usuário. Tente novamente.')
		}
	}
}
