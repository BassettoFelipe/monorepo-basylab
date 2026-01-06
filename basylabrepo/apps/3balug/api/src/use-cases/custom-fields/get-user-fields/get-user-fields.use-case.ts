import { ForbiddenError } from '@basylab/core/errors'
import type { User } from '@/db/schema/users'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldResponseRepository } from '@/repositories/contracts/custom-field-response.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { PLAN_FEATURES } from '@/types/features'

type FieldWithValue = {
	id: string
	companyId: string
	label: string
	type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'checkbox' | 'date' | 'file'
	placeholder: string | null
	helpText: string | null
	isRequired: boolean
	isActive: boolean
	options: string[] | null
	allowMultiple: boolean | null
	validation: {
		minLength?: number
		maxLength?: number
		min?: number
		max?: number
		pattern?: string
	} | null
	fileConfig: {
		maxFileSize?: number
		maxFiles?: number
		allowedTypes?: string[]
	} | null
	order: number
	createdAt: Date
	updatedAt: Date
	value: string | null
}

type UserInfo = {
	id: string
	name: string
	email: string
	avatarUrl: string | null
}

type GetUserFieldsInput = {
	currentUser: User
	targetUserId: string
}

type GetUserFieldsOutput = {
	fields: FieldWithValue[]
	user: UserInfo
}

export class GetUserFieldsUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly customFieldResponseRepository: ICustomFieldResponseRepository,
		private readonly planFeatureRepository: IPlanFeatureRepository,
	) {}

	async execute(input: GetUserFieldsInput): Promise<GetUserFieldsOutput> {
		const { currentUser, targetUserId } = input

		const targetUser = await this.userRepository.findById(targetUserId)
		if (!targetUser) {
			throw new ForbiddenError('Usuário alvo não encontrado')
		}

		const userInfo: UserInfo = {
			id: targetUser.id,
			name: targetUser.name,
			email: targetUser.email,
			avatarUrl: targetUser.avatarUrl,
		}

		if (!currentUser.companyId) {
			return { fields: [], user: userInfo }
		}

		if (targetUser.companyId !== currentUser.companyId) {
			throw new ForbiddenError('Você não tem permissão para visualizar este usuário')
		}

		let subscription = await this.subscriptionRepository.findCurrentByUserId(currentUser.id)

		if (!subscription && currentUser.createdBy) {
			const owner = await this.userRepository.findById(currentUser.createdBy)
			if (owner) {
				subscription = await this.subscriptionRepository.findCurrentByUserId(owner.id)
			}
		}

		const hasFeature =
			subscription?.plan?.slug &&
			(await this.planFeatureRepository.planHasFeature(
				subscription.plan.slug,
				PLAN_FEATURES.CUSTOM_FIELDS,
			))

		if (!hasFeature) {
			return { fields: [], user: userInfo }
		}

		const allFields = await this.customFieldRepository.findByCompanyId(currentUser.companyId)
		const userResponses = await this.customFieldResponseRepository.findByUserId(targetUser.id)

		const fieldsWithResponses: FieldWithValue[] = allFields.map((field) => {
			const response = userResponses.find((r) => r.fieldId === field.id)
			return {
				...field,
				type: field.type as FieldWithValue['type'],
				value: response?.value ?? null,
			}
		})

		return { fields: fieldsWithResponses, user: userInfo }
	}
}
