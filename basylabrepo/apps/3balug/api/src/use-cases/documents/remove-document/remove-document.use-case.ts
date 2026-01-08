import { ForbiddenError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import { logger } from '@/config/logger'
import { DOCUMENT_ENTITY_TYPES } from '@/db/schema/documents'
import type { User } from '@/db/schema/users'
import type { IDocumentRepository } from '@/repositories/contracts/document.repository'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

interface RemoveDocumentInput {
	documentId: string
	user: User
}

interface RemoveDocumentOutput {
	success: boolean
	message: string
}

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]

export class RemoveDocumentUseCase {
	constructor(
		private readonly documentRepository: IDocumentRepository,
		private readonly propertyOwnerRepository: IPropertyOwnerRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: RemoveDocumentInput): Promise<RemoveDocumentOutput> {
		const { documentId, user } = input

		if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
			throw new ForbiddenError('Voce nao tem permissao para remover documentos.')
		}

		if (!user.companyId) {
			throw new InternalServerError('Usuario sem empresa vinculada.')
		}

		const document = await this.documentRepository.findById(documentId)
		if (!document) {
			throw new NotFoundError('Documento nao encontrado.')
		}

		// Verificar se documento ja foi excluido
		if (document.deletedAt) {
			throw new NotFoundError('Documento nao encontrado.')
		}

		if (document.companyId !== user.companyId) {
			throw new ForbiddenError('Documento nao pertence a sua empresa.')
		}

		if (user.role === USER_ROLES.BROKER) {
			if (document.entityType === DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER) {
				const owner = await this.propertyOwnerRepository.findById(document.entityId)
				if (owner && owner.createdBy !== user.id) {
					throw new ForbiddenError(
						'Voce so pode remover documentos de proprietarios que voce cadastrou.',
					)
				}
			} else if (document.entityType === DOCUMENT_ENTITY_TYPES.TENANT) {
				const tenant = await this.tenantRepository.findById(document.entityId)
				if (tenant && tenant.createdBy !== user.id) {
					throw new ForbiddenError(
						'Voce so pode remover documentos de inquilinos que voce cadastrou.',
					)
				}
			}
		}

		try {
			// Soft delete - mantem o arquivo no storage para historico
			await this.documentRepository.softDelete(documentId, { deletedBy: user.id })

			logger.info(
				{
					documentId,
					entityType: document.entityType,
					entityId: document.entityId,
					removedBy: user.id,
				},
				'Documento removido (soft delete)',
			)

			return {
				success: true,
				message: 'Documento removido com sucesso.',
			}
		} catch (error) {
			logger.error({ err: error, documentId }, 'Erro ao remover documento')
			throw new InternalServerError('Erro ao remover documento. Tente novamente.')
		}
	}
}
