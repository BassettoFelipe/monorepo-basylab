import {
	BadRequestError,
	EmailAlreadyExistsError,
	ForbiddenError,
	InternalServerError,
	PlanLimitExceededError,
} from '@basylab/core/errors'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { ICompanyRepository } from '@/repositories/contracts/company.repository'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldResponseRepository } from '@/repositories/contracts/custom-field-response.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { emailService } from '@/services/email'
import { PLAN_FEATURES } from '@/types/features'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'
import { PermissionsUtils } from '@/utils/permissions.utils'

type CustomFieldValue = {
	fieldId: string
	value: string
}

type CreateUserInput = {
	email: string
	name: string
	role: UserRole
	phone: string
	password: string
	createdBy: User
	customFields?: CustomFieldValue[]
}

type CreateUserOutput = {
	id: string
	email: string
	name: string
	role: UserRole
	companyId: string | null
	isActive: boolean
}

export class CreateUserUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly companyRepository: ICompanyRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly planRepository: IPlanRepository,
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly customFieldResponseRepository: ICustomFieldResponseRepository,
		private readonly planFeatureRepository: IPlanFeatureRepository,
	) {}

	async execute(input: CreateUserInput): Promise<CreateUserOutput> {
		if (!PermissionsUtils.canCreateUser(input.createdBy.role as UserRole)) {
			throw new ForbiddenError(
				'Você não tem permissão para criar usuários. Apenas proprietários e gerentes podem realizar esta ação.',
			)
		}

		if (input.role === USER_ROLES.INSURANCE_ANALYST && input.createdBy.role !== USER_ROLES.OWNER) {
			throw new ForbiddenError('Apenas o proprietário pode cadastrar analistas de seguros.')
		}

		if (!input.phone || !input.phone.trim()) {
			throw new BadRequestError('Celular é obrigatório.')
		}

		const normalizedPhone = input.phone.replace(/\D/g, '')
		if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
			throw new BadRequestError('Formato de celular inválido. Use o formato: (11) 99999-9999')
		}

		if (!input.createdBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		const company = await this.companyRepository.findById(input.createdBy.companyId)
		if (!company) {
			throw new InternalServerError('Empresa não encontrada')
		}

		let subscription = await this.subscriptionRepository.findActiveByUserId(input.createdBy.id)

		if (!subscription && input.createdBy.createdBy) {
			subscription = await this.subscriptionRepository.findActiveByUserId(input.createdBy.createdBy)
		}

		if (!subscription) {
			throw new ForbiddenError('Assinatura inativa. Renove sua assinatura para adicionar usuários.')
		}

		const plan = await this.planRepository.findById(subscription.planId)
		if (!plan) {
			throw new InternalServerError('Plano não encontrado')
		}

		const existingUsers = await this.userRepository.findByCompanyId(company.id)
		const activeUsers = existingUsers.filter((u) => u.isActive && u.role !== USER_ROLES.OWNER)

		if (plan.maxUsers !== null && activeUsers.length >= plan.maxUsers) {
			throw new PlanLimitExceededError(
				`Seu plano permite no máximo ${plan.maxUsers} usuário(s). Faça upgrade para adicionar mais.`,
			)
		}

		if (input.role === USER_ROLES.MANAGER) {
			const managers = activeUsers.filter((u) => u.role === USER_ROLES.MANAGER)
			if (managers.length >= plan.maxManagers) {
				throw new PlanLimitExceededError(
					`Seu plano permite no máximo ${plan.maxManagers} gerente(s). Faça upgrade para adicionar mais.`,
				)
			}
		}

		const normalizedEmail = input.email.toLowerCase().trim()
		const existingUser = await this.userRepository.findByEmail(normalizedEmail)
		if (existingUser) {
			throw new EmailAlreadyExistsError()
		}

		try {
			const newUser = await this.userRepository.create({
				email: normalizedEmail,
				password: null,
				name: input.name,
				role: input.role as string,
				phone: normalizedPhone,
				companyId: company.id,
				createdBy: input.createdBy.id,
				isActive: true,
				isEmailVerified: true, // Conta já confirmada - sem senha definida, login impossível até reset
			})

			const resetPasswordUrl = `${env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(normalizedEmail)}`

			try {
				await emailService.sendUserInvitation(
					normalizedEmail,
					input.name,
					company.name,
					input.role,
					input.createdBy.name,
					resetPasswordUrl,
				)

				logger.info(
					{
						userId: newUser.id,
						email: newUser.email,
						role: newUser.role,
						companyId: company.id,
						createdBy: input.createdBy.id,
					},
					'Novo usuário criado e email de convite enviado com sucesso',
				)
			} catch (emailError) {
				logger.error(
					{
						err: emailError,
						userId: newUser.id,
						email: newUser.email,
					},
					'Usuário criado mas falha ao enviar email de convite',
				)
				// Não falha a operação se o email não for enviado
			}

			if (input.customFields && input.customFields.length > 0) {
				const hasCustomFieldsFeature = await this.planFeatureRepository.planHasFeature(
					plan.slug,
					PLAN_FEATURES.CUSTOM_FIELDS,
				)

				if (hasCustomFieldsFeature) {
					const activeFields = await this.customFieldRepository.findActiveByCompanyId(company.id)

					const requiredFields = activeFields.filter((f) => f.isRequired)
					for (const requiredField of requiredFields) {
						const providedValue = input.customFields.find((cf) => cf.fieldId === requiredField.id)
						if (!providedValue || !providedValue.value.trim()) {
							throw new BadRequestError(`O campo "${requiredField.label}" é obrigatório.`)
						}
					}

					const responses = input.customFields
						.filter((cf) => {
							// Apenas salvar respostas para campos que existem e estão ativos
							return activeFields.some((f) => f.id === cf.fieldId)
						})
						.map((cf) => ({
							userId: newUser.id,
							fieldId: cf.fieldId,
							value: cf.value,
						}))

					if (responses.length > 0) {
						await this.customFieldResponseRepository.createMany(responses)
						logger.info(
							{
								userId: newUser.id,
								fieldCount: responses.length,
							},
							'Campos customizados salvos para o usuário',
						)
					}
				}
			}

			return {
				id: newUser.id,
				email: newUser.email,
				name: newUser.name,
				role: newUser.role as UserRole,
				companyId: newUser.companyId,
				isActive: newUser.isActive,
			}
		} catch (error) {
			logger.error(
				{
					err: error,
					email: input.email,
					companyId: company.id,
				},
				'Erro ao criar usuário',
			)

			throw new InternalServerError('Erro ao criar usuário. Tente novamente.')
		}
	}
}
