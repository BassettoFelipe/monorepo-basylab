import { ForbiddenError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { IPropertyPhotoRepository } from '@/repositories/contracts/property-photo.repository'
import type { IStorageService } from '@/services/storage'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

interface RemovePropertyPhotoInput {
	photoId: string
	user: User
}

interface RemovePropertyPhotoOutput {
	success: boolean
	message: string
}

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]

export class RemovePropertyPhotoUseCase {
	constructor(
		private readonly propertyPhotoRepository: IPropertyPhotoRepository,
		private readonly propertyRepository: IPropertyRepository,
		private readonly storageService: IStorageService,
	) {}

	async execute(input: RemovePropertyPhotoInput): Promise<RemovePropertyPhotoOutput> {
		const { photoId, user } = input

		if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
			throw new ForbiddenError('Voce nao tem permissao para remover fotos.')
		}

		if (!user.companyId) {
			throw new InternalServerError('Usuario sem empresa vinculada.')
		}

		const photo = await this.propertyPhotoRepository.findById(photoId)
		if (!photo) {
			throw new NotFoundError('Foto nao encontrada.')
		}

		const property = await this.propertyRepository.findById(photo.propertyId)
		if (!property) {
			throw new NotFoundError('Imovel nao encontrado.')
		}

		if (property.companyId !== user.companyId) {
			throw new ForbiddenError('Imovel nao pertence a sua empresa.')
		}

		if (user.role === USER_ROLES.BROKER && property.brokerId !== user.id) {
			throw new ForbiddenError('Voce so pode remover fotos de imoveis que voce gerencia.')
		}

		try {
			try {
				await this.storageService.delete(photo.filename)
			} catch (storageError) {
				logger.warn(
					{ err: storageError, filename: photo.filename },
					'Erro ao remover arquivo do storage (continuando com a remocao do registro)',
				)
			}

			if (photo.isPrimary) {
				const remainingPhotos = await this.propertyPhotoRepository.findByPropertyId(
					photo.propertyId,
				)
				const otherPhotos = remainingPhotos.filter((p) => p.id !== photoId)
				if (otherPhotos.length > 0) {
					await this.propertyPhotoRepository.setPrimary(otherPhotos[0].id, photo.propertyId)
				}
			}

			await this.propertyPhotoRepository.delete(photoId)

			logger.info(
				{
					photoId,
					propertyId: photo.propertyId,
					removedBy: user.id,
				},
				'Foto removida do imovel',
			)

			return {
				success: true,
				message: 'Foto removida com sucesso.',
			}
		} catch (error) {
			logger.error({ err: error, photoId }, 'Erro ao remover foto do imovel')
			throw new InternalServerError('Erro ao remover foto. Tente novamente.')
		}
	}
}
