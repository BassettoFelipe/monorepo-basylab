import { BadRequestError, ForbiddenError, PlanLimitExceededError } from '@basylab/core/errors'
import type { CustomField, FieldType } from '@/db/schema/custom-fields'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import type { User } from '@/db/schema/users'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { ICustomFieldCacheService } from '@/services/cache'
import { PLAN_FEATURES } from '@/types/features'
import { USER_ROLES } from '@/types/roles'

type CreateCustomFieldInput = {
	user: User
	label: string
	type: FieldType
	placeholder?: string
	helpText?: string
	isRequired?: boolean
	options?: string[]
	allowMultiple?: boolean
	validation?: {
		minLength?: number
		maxLength?: number
		min?: number
		max?: number
		pattern?: string
	}
	fileConfig?: {
		maxFileSize?: number
		maxFiles?: number
		allowedTypes?: string[]
	}
}

type CreateCustomFieldOutput = CustomField

export class CreateCustomFieldUseCase {
	constructor(
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly planFeatureRepository: IPlanFeatureRepository,
		private readonly cache?: ICustomFieldCacheService,
	) {}

	async execute(input: CreateCustomFieldInput): Promise<CreateCustomFieldOutput> {
		if (input.user.role !== USER_ROLES.OWNER) {
			throw new ForbiddenError('Apenas o proprietário pode criar campos personalizados.')
		}

		if (!input.user.companyId) {
			throw new BadRequestError('Usuário sem empresa vinculada.')
		}

		const subscription = await this.subscriptionRepository.findCurrentByUserId(input.user.id)
		if (!subscription || subscription.computedStatus !== 'active') {
			throw new ForbiddenError(
				'Assinatura inativa. Renove sua assinatura para usar esta funcionalidade.',
			)
		}

		const hasFeature = await this.planFeatureRepository.planHasFeature(
			subscription.plan.slug,
			PLAN_FEATURES.CUSTOM_FIELDS,
		)
		if (!hasFeature) {
			throw new PlanLimitExceededError(
				'Seu plano não permite campos personalizados. Faça upgrade para o plano House para ter acesso a esta funcionalidade.',
			)
		}

		const validTypes = Object.values(FIELD_TYPES)
		if (!validTypes.includes(input.type)) {
			throw new BadRequestError(`Tipo de campo inválido. Tipos válidos: ${validTypes.join(', ')}`)
		}

		if (input.type === FIELD_TYPES.SELECT) {
			if (!input.options || input.options.length < 2) {
				throw new BadRequestError('Campos do tipo seleção devem ter pelo menos 2 opções.')
			}

			const uniqueOptions = new Set(input.options.map((opt) => opt.toLowerCase().trim()))
			if (uniqueOptions.size !== input.options.length) {
				throw new BadRequestError('Não é permitido ter opções duplicadas.')
			}
		}

		if (input.type === FIELD_TYPES.FILE) {
			const fileConfig = input.fileConfig || {}

			if (fileConfig.maxFileSize !== undefined) {
				if (fileConfig.maxFileSize < 1 || fileConfig.maxFileSize > 10) {
					throw new BadRequestError('O tamanho máximo do arquivo deve ser entre 1 e 10 MB.')
				}
			}

			if (fileConfig.maxFiles !== undefined) {
				if (fileConfig.maxFiles < 1 || fileConfig.maxFiles > 5) {
					throw new BadRequestError('A quantidade máxima de arquivos deve ser entre 1 e 5.')
				}
			}

			if (!fileConfig.allowedTypes || fileConfig.allowedTypes.length === 0) {
				throw new BadRequestError('Selecione pelo menos um tipo de arquivo permitido.')
			}
		}

		if (!input.label || input.label.trim().length < 2) {
			throw new BadRequestError('O nome do campo deve ter pelo menos 2 caracteres.')
		}

		const existingFields = await this.customFieldRepository.findByCompanyId(input.user.companyId)
		const maxOrder = existingFields.reduce((max, field) => Math.max(max, field.order), -1)

		const newField = await this.customFieldRepository.create({
			companyId: input.user.companyId,
			label: input.label.trim(),
			type: input.type,
			placeholder: input.placeholder?.trim() || null,
			helpText: input.helpText?.trim() || null,
			isRequired: input.isRequired ?? false,
			options: input.type === FIELD_TYPES.SELECT ? input.options : null,
			allowMultiple:
				input.type === FIELD_TYPES.SELECT || input.type === FIELD_TYPES.CHECKBOX
					? (input.allowMultiple ?? false)
					: null,
			validation: input.validation || null,
			fileConfig:
				input.type === FIELD_TYPES.FILE
					? {
							maxFileSize: input.fileConfig?.maxFileSize ?? 5,
							maxFiles: input.fileConfig?.maxFiles ?? 1,
							allowedTypes: input.fileConfig?.allowedTypes ?? ['image/*', 'application/pdf'],
						}
					: null,
			order: maxOrder + 1,
			isActive: true,
		})

		await this.cache?.invalidate(input.user.companyId)

		return newField
	}
}
