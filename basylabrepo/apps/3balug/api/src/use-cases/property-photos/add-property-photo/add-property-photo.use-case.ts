import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { IPropertyPhotoRepository } from '@/repositories/contracts/property-photo.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

interface AddPropertyPhotoInput {
	propertyId: string
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	isPrimary?: boolean
	user: User
}

interface AddPropertyPhotoOutput {
	id: string
	propertyId: string
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	order: number
	isPrimary: boolean
	createdAt: Date
}

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]
const MAX_PHOTOS_PER_PROPERTY = 20
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export class AddPropertyPhotoUseCase {
	constructor(
		private readonly propertyPhotoRepository: IPropertyPhotoRepository,
		private readonly propertyRepository: IPropertyRepository,
	) {}

	async execute(input: AddPropertyPhotoInput): Promise<AddPropertyPhotoOutput> {
		const { propertyId, filename, originalName, mimeType, size, url, isPrimary, user } = input

		if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
			throw new ForbiddenError('Voce nao tem permissao para adicionar fotos.')
		}

		if (!user.companyId) {
			throw new InternalServerError('Usuario sem empresa vinculada.')
		}

		if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
			throw new BadRequestError(
				`Tipo de arquivo nao permitido. Use: ${ALLOWED_MIME_TYPES.join(', ')}.`,
			)
		}

		if (size > MAX_FILE_SIZE) {
			throw new BadRequestError('Arquivo muito grande. Tamanho maximo: 10MB.')
		}

		const property = await this.propertyRepository.findById(propertyId)
		if (!property) {
			throw new NotFoundError('Imovel nao encontrado.')
		}

		if (property.companyId !== user.companyId) {
			throw new ForbiddenError('Imovel nao pertence a sua empresa.')
		}

		if (user.role === USER_ROLES.BROKER && property.brokerId !== user.id) {
			throw new ForbiddenError('Voce so pode adicionar fotos em imoveis que voce gerencia.')
		}

		const photoCount = await this.propertyPhotoRepository.countByPropertyId(propertyId)
		if (photoCount >= MAX_PHOTOS_PER_PROPERTY) {
			throw new BadRequestError(`Limite de ${MAX_PHOTOS_PER_PROPERTY} fotos por imovel atingido.`)
		}

		try {
			const order = photoCount

			const shouldBePrimary = isPrimary === true || photoCount === 0

			const photo =
				shouldBePrimary && photoCount > 0
					? await this.propertyPhotoRepository.createAsPrimary(
							{
								propertyId,
								filename,
								originalName,
								mimeType,
								size,
								url,
								order,
								isPrimary: true,
								uploadedBy: user.id,
							},
							propertyId,
						)
					: await this.propertyPhotoRepository.create({
							propertyId,
							filename,
							originalName,
							mimeType,
							size,
							url,
							order,
							isPrimary: shouldBePrimary,
							uploadedBy: user.id,
						})

			logger.info(
				{
					photoId: photo.id,
					propertyId,
					uploadedBy: user.id,
				},
				'Foto adicionada ao imovel',
			)

			return {
				id: photo.id,
				propertyId: photo.propertyId,
				filename: photo.filename,
				originalName: photo.originalName,
				mimeType: photo.mimeType,
				size: photo.size,
				url: photo.url,
				order: photo.order ?? 0,
				isPrimary: photo.isPrimary ?? false,
				createdAt: photo.createdAt,
			}
		} catch (error) {
			logger.error({ err: error, propertyId }, 'Erro ao adicionar foto ao imovel')
			throw new InternalServerError('Erro ao adicionar foto. Tente novamente.')
		}
	}
}
