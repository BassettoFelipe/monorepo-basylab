import { randomUUID } from 'node:crypto'
import { FileUtils, FileValidation, NotFoundError } from '@basylab/core'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IStorageService } from '@/services/storage'

type EntityType = 'tenant' | 'property_owner' | 'property' | 'user'

interface GetPresignedUrlInput {
	fileName: string
	contentType: string
	userId: string
	entityType: EntityType
	entityId: string
	fieldId?: string
	allowedTypes?: string[]
}

interface GetPresignedUrlOutput {
	uploadUrl: string
	key: string
	publicUrl: string
	expiresAt: Date
}

interface GetPresignedUrlDependencies {
	storageService: IStorageService
	tenantRepository: ITenantRepository
	propertyOwnerRepository: IPropertyOwnerRepository
	propertyRepository: IPropertyRepository
	userRepository: IUserRepository
}

export class GetPresignedUrlUseCase {
	constructor(private deps: GetPresignedUrlDependencies) {}

	async execute(input: GetPresignedUrlInput): Promise<GetPresignedUrlOutput> {
		const { fileName, contentType, userId, entityType, entityId, fieldId, allowedTypes } = input

		// Valida que a entidade existe antes de permitir upload
		await this.validateEntityExists(entityType, entityId)

		if (allowedTypes && allowedTypes.length > 0) {
			const allowed = FileValidation.isTypeAllowed(contentType, allowedTypes)
			if (!allowed) {
				throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`)
			}
		}

		const fileExtension = FileUtils.getExtension(fileName, contentType)
		const uniqueId = randomUUID()
		const sanitized = FileUtils.sanitizeFileName(fileName)

		const keyParts = ['files', userId, entityType, entityId]
		if (fieldId) {
			keyParts.push(fieldId)
		}
		keyParts.push(`${uniqueId}_${sanitized}${fileExtension}`)

		const key = keyParts.join('/')

		const result = await this.deps.storageService.getPresignedUploadUrl(key, contentType, 300)

		return {
			uploadUrl: result.url,
			key: result.key,
			publicUrl: this.deps.storageService.getPublicUrl(key),
			expiresAt: result.expiresAt,
		}
	}

	private async validateEntityExists(entityType: EntityType, entityId: string): Promise<void> {
		switch (entityType) {
			case 'tenant': {
				const tenant = await this.deps.tenantRepository.findById(entityId)
				if (!tenant) {
					throw new NotFoundError('Inquilino não encontrado')
				}
				break
			}
			case 'property_owner': {
				const owner = await this.deps.propertyOwnerRepository.findById(entityId)
				if (!owner) {
					throw new NotFoundError('Proprietário não encontrado')
				}
				break
			}
			case 'property': {
				const property = await this.deps.propertyRepository.findById(entityId)
				if (!property) {
					throw new NotFoundError('Imóvel não encontrado')
				}
				break
			}
			case 'user': {
				const user = await this.deps.userRepository.findById(entityId)
				if (!user) {
					throw new NotFoundError('Usuário não encontrado')
				}
				break
			}
			default:
				throw new Error(`Tipo de entidade inválido: ${entityType}`)
		}
	}
}
