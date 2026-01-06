import { BadRequestError, ForbiddenError } from '@basylab/core/errors'
import type { User } from '@/db/schema/users'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldCacheService } from '@/services/cache'
import { USER_ROLES } from '@/types/roles'

type ReorderCustomFieldsInput = {
	user: User
	fieldIds: string[]
}

type ReorderCustomFieldsOutput = {
	success: boolean
}

export class ReorderCustomFieldsUseCase {
	constructor(
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly cache?: ICustomFieldCacheService,
	) {}

	async execute(input: ReorderCustomFieldsInput): Promise<ReorderCustomFieldsOutput> {
		if (input.user.role !== USER_ROLES.OWNER) {
			throw new ForbiddenError('Apenas o proprietário pode reordenar campos personalizados.')
		}

		if (!input.user.companyId) {
			throw new BadRequestError('Usuário sem empresa vinculada.')
		}

		if (!input.fieldIds || input.fieldIds.length === 0) {
			throw new BadRequestError('Nenhum campo fornecido para reordenação.')
		}

		const existingFields = await this.customFieldRepository.findByCompanyId(input.user.companyId)
		const existingFieldIds = new Set(existingFields.map((f) => f.id))

		const validFieldIds = input.fieldIds.filter((fieldId) => existingFieldIds.has(fieldId))

		if (validFieldIds.length === 0) {
			throw new BadRequestError('Nenhum campo válido fornecido para reordenação.')
		}

		await this.customFieldRepository.reorder(input.user.companyId, validFieldIds)

		await this.cache?.invalidate(input.user.companyId)

		return { success: true }
	}
}
