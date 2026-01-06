import { BadRequestError, ForbiddenError, NotFoundError } from '@basylab/core/errors'
import type { CustomField, FieldType } from '@/db/schema/custom-fields'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import type { User } from '@/db/schema/users'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldCacheService } from '@/services/cache'
import { USER_ROLES } from '@/types/roles'

type UpdateCustomFieldInput = {
	user: User
	fieldId: string
	label?: string
	type?: FieldType
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
	isActive?: boolean
}

type UpdateCustomFieldOutput = CustomField

export class UpdateCustomFieldUseCase {
	constructor(
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly cache?: ICustomFieldCacheService,
	) {}

	async execute(input: UpdateCustomFieldInput): Promise<UpdateCustomFieldOutput> {
		if (input.user.role !== USER_ROLES.OWNER) {
			throw new ForbiddenError('Apenas o proprietário pode editar campos personalizados.')
		}

		if (!input.user.companyId) {
			throw new BadRequestError('Usuário sem empresa vinculada.')
		}

		const existingField = await this.customFieldRepository.findById(input.fieldId)
		if (!existingField) {
			throw new NotFoundError('Campo não encontrado.')
		}

		if (existingField.companyId !== input.user.companyId) {
			throw new ForbiddenError('Você não tem permissão para editar este campo.')
		}

		if (input.type) {
			const validTypes = Object.values(FIELD_TYPES)
			if (!validTypes.includes(input.type)) {
				throw new BadRequestError(`Tipo de campo inválido. Tipos válidos: ${validTypes.join(', ')}`)
			}
		}

		const newType = input.type || existingField.type
		if (newType === FIELD_TYPES.SELECT) {
			const newOptions = input.options ?? existingField.options
			if (!newOptions || newOptions.length < 2) {
				throw new BadRequestError('Campos do tipo seleção devem ter pelo menos 2 opções.')
			}
			if (input.options) {
				const uniqueOptions = new Set(input.options.map((opt) => opt.toLowerCase().trim()))
				if (uniqueOptions.size !== input.options.length) {
					throw new BadRequestError('Não é permitido ter opções duplicadas.')
				}
			}
		}

		if (newType === FIELD_TYPES.FILE && input.fileConfig) {
			if (input.fileConfig.maxFileSize !== undefined) {
				if (input.fileConfig.maxFileSize < 1 || input.fileConfig.maxFileSize > 10) {
					throw new BadRequestError('O tamanho máximo do arquivo deve ser entre 1 e 10 MB.')
				}
			}
			if (input.fileConfig.maxFiles !== undefined) {
				if (input.fileConfig.maxFiles < 1 || input.fileConfig.maxFiles > 5) {
					throw new BadRequestError('A quantidade máxima de arquivos deve ser entre 1 e 5.')
				}
			}
			if (input.fileConfig.allowedTypes !== undefined) {
				if (input.fileConfig.allowedTypes.length === 0) {
					throw new BadRequestError('Selecione pelo menos um tipo de arquivo permitido.')
				}
			}
		}

		if (input.label !== undefined && input.label.trim().length < 2) {
			throw new BadRequestError('O nome do campo deve ter pelo menos 2 caracteres.')
		}

		const updateData: Partial<typeof existingField> = {}

		if (input.label !== undefined) updateData.label = input.label.trim()
		if (input.type !== undefined) updateData.type = input.type
		if (input.placeholder !== undefined) updateData.placeholder = input.placeholder?.trim() || null
		if (input.helpText !== undefined) updateData.helpText = input.helpText?.trim() || null
		if (input.isRequired !== undefined) updateData.isRequired = input.isRequired
		if (input.options !== undefined)
			updateData.options = newType === FIELD_TYPES.SELECT ? input.options : null
		if (input.allowMultiple !== undefined)
			updateData.allowMultiple = newType === FIELD_TYPES.SELECT ? input.allowMultiple : null
		if (input.validation !== undefined) updateData.validation = input.validation
		if (input.fileConfig !== undefined)
			updateData.fileConfig = newType === FIELD_TYPES.FILE ? input.fileConfig : null
		if (input.isActive !== undefined) updateData.isActive = input.isActive

		const updatedField = await this.customFieldRepository.update(input.fieldId, updateData)

		if (!updatedField) {
			throw new BadRequestError('Erro ao atualizar campo.')
		}

		await this.cache?.invalidate(input.user.companyId)

		return updatedField
	}
}
