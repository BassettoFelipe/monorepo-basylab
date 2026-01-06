import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { DocumentEntityType } from '@/db/schema/documents'
import { DOCUMENT_ENTITY_TYPES } from '@/db/schema/documents'
import type { User } from '@/db/schema/users'
import type { IDocumentRepository } from '@/repositories/contracts/document.repository'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

interface ListDocumentsInput {
	entityType: DocumentEntityType
	entityId: string
	user: User
	limit?: number
	offset?: number
}

interface DocumentOutput {
	id: string
	entityType: string
	entityId: string
	documentType: string
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	description: string | null
	createdAt: Date
}

interface ListDocumentsOutput {
	documents: DocumentOutput[]
	total: number
}

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]

export class ListDocumentsUseCase {
	constructor(
		private readonly documentRepository: IDocumentRepository,
		private readonly propertyOwnerRepository: IPropertyOwnerRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: ListDocumentsInput): Promise<ListDocumentsOutput> {
		const { entityType, entityId, user } = input

		if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
			throw new ForbiddenError('Voce nao tem permissao para listar documentos.')
		}

		if (!user.companyId) {
			throw new InternalServerError('Usuario sem empresa vinculada.')
		}

		if (!Object.values(DOCUMENT_ENTITY_TYPES).includes(entityType)) {
			throw new BadRequestError(
				`Tipo de entidade invalido. Use: ${Object.values(DOCUMENT_ENTITY_TYPES).join(', ')}.`,
			)
		}

		if (entityType === DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER) {
			const owner = await this.propertyOwnerRepository.findById(entityId)
			if (!owner) {
				throw new NotFoundError('Proprietario nao encontrado.')
			}
			if (owner.companyId !== user.companyId) {
				throw new ForbiddenError('Proprietario nao pertence a sua empresa.')
			}
			// Se for broker, verificar se eh o criador
			if (user.role === USER_ROLES.BROKER && owner.createdBy !== user.id) {
				throw new ForbiddenError('Voce so pode ver documentos de proprietarios que voce cadastrou.')
			}
		} else if (entityType === DOCUMENT_ENTITY_TYPES.TENANT) {
			const tenant = await this.tenantRepository.findById(entityId)
			if (!tenant) {
				throw new NotFoundError('Inquilino nao encontrado.')
			}
			if (tenant.companyId !== user.companyId) {
				throw new ForbiddenError('Inquilino nao pertence a sua empresa.')
			}
			// Se for broker, verificar se eh o criador
			if (user.role === USER_ROLES.BROKER && tenant.createdBy !== user.id) {
				throw new ForbiddenError('Voce so pode ver documentos de inquilinos que voce cadastrou.')
			}
		}

		try {
			const limit = input.limit ?? 50
			const offset = input.offset ?? 0

			const [documents, total] = await Promise.all([
				this.documentRepository.findByEntity(entityType, entityId, {
					limit,
					offset,
				}),
				this.documentRepository.countByEntity(entityType, entityId),
			])

			return {
				documents: documents.map((doc) => ({
					id: doc.id,
					entityType: doc.entityType,
					entityId: doc.entityId,
					documentType: doc.documentType,
					filename: doc.filename,
					originalName: doc.originalName,
					mimeType: doc.mimeType,
					size: doc.size,
					url: doc.url,
					description: doc.description,
					createdAt: doc.createdAt,
				})),
				total,
			}
		} catch (error) {
			logger.error({ err: error, entityType, entityId }, 'Erro ao listar documentos')
			throw new InternalServerError('Erro ao listar documentos. Tente novamente.')
		}
	}
}
