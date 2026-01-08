import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type {
	ListingType,
	Property,
	PropertyFeatures,
	PropertyStatus,
	PropertyType,
} from '@/db/schema/properties'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import type { User } from '@/db/schema/users'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]

type UpdatePropertyInput = {
	id: string
	ownerId?: string
	brokerId?: string | null
	title?: string
	description?: string | null
	type?: PropertyType
	listingType?: ListingType
	status?: PropertyStatus
	address?: string | null
	addressNumber?: string | null
	addressComplement?: string | null
	neighborhood?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	bedrooms?: number
	bathrooms?: number
	suites?: number
	parkingSpaces?: number
	area?: number | null
	totalArea?: number | null
	builtArea?: number | null
	floor?: number | null
	totalFloors?: number | null
	yearBuilt?: number | null
	rentalPrice?: number | null
	salePrice?: number | null
	iptuPrice?: number | null
	condoFee?: number | null
	commissionPercentage?: number | null
	commissionValue?: number | null
	isMarketplace?: boolean
	notes?: string | null
	features?: PropertyFeatures
	updatedBy: User
}

type UpdatePropertyOutput = Property

export class UpdatePropertyUseCase {
	constructor(
		private readonly propertyRepository: IPropertyRepository,
		private readonly propertyOwnerRepository: IPropertyOwnerRepository,
	) {}

	async execute(input: UpdatePropertyInput): Promise<UpdatePropertyOutput> {
		const { updatedBy } = input

		if (!ALLOWED_ROLES.includes(updatedBy.role as UserRole)) {
			throw new ForbiddenError('Você não tem permissão para editar imóveis.')
		}

		if (!updatedBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada.')
		}

		const property = await this.propertyRepository.findById(input.id)

		if (!property) {
			throw new NotFoundError('Imóvel não encontrado.')
		}

		if (property.companyId !== updatedBy.companyId) {
			throw new ForbiddenError('Você não tem permissão para editar este imóvel.')
		}

		if (updatedBy.role === USER_ROLES.BROKER && property.brokerId !== updatedBy.id) {
			throw new ForbiddenError('Você só pode editar imóveis dos quais é responsável.')
		}

		const updateData: Partial<Property> = {}

		if (input.title !== undefined) {
			updateData.title = input.title.trim()
		}

		if (input.description !== undefined) {
			updateData.description = input.description?.trim() || null
		}

		if (input.type !== undefined) {
			const validTypes = Object.values(PROPERTY_TYPES)
			if (!validTypes.includes(input.type)) {
				throw new BadRequestError(`Tipo de imóvel inválido. Use: ${validTypes.join(', ')}.`)
			}
			updateData.type = input.type
		}

		if (input.listingType !== undefined) {
			const validListingTypes = Object.values(LISTING_TYPES)
			if (!validListingTypes.includes(input.listingType)) {
				throw new BadRequestError(`Tipo de anúncio inválido. Use: ${validListingTypes.join(', ')}.`)
			}
			updateData.listingType = input.listingType
		}

		if (input.status !== undefined) {
			const validStatuses = Object.values(PROPERTY_STATUS)
			if (!validStatuses.includes(input.status)) {
				throw new BadRequestError(`Status inválido. Use: ${validStatuses.join(', ')}.`)
			}
			if (updatedBy.role === USER_ROLES.BROKER && input.status === PROPERTY_STATUS.SOLD) {
				throw new ForbiddenError(
					'Apenas proprietários e gerentes podem marcar imóveis como vendidos.',
				)
			}
			updateData.status = input.status
		}

		if (input.ownerId !== undefined && input.ownerId !== property.ownerId) {
			const newOwner = await this.propertyOwnerRepository.findById(input.ownerId)
			if (!newOwner) {
				throw new NotFoundError('Proprietário não encontrado.')
			}
			if (newOwner.companyId !== updatedBy.companyId) {
				throw new ForbiddenError('Proprietário não pertence à sua empresa.')
			}
			updateData.ownerId = input.ownerId
		}

		if (input.brokerId !== undefined) {
			if (updatedBy.role === USER_ROLES.BROKER) {
				throw new ForbiddenError('Você não pode alterar o corretor responsável.')
			}
			updateData.brokerId = input.brokerId
		}

		if (input.address !== undefined) {
			updateData.address = input.address?.trim() || null
		}

		if (input.addressNumber !== undefined) {
			updateData.addressNumber = input.addressNumber?.trim() || null
		}

		if (input.addressComplement !== undefined) {
			updateData.addressComplement = input.addressComplement?.trim() || null
		}

		if (input.neighborhood !== undefined) {
			updateData.neighborhood = input.neighborhood?.trim() || null
		}

		if (input.city !== undefined) {
			updateData.city = input.city?.trim() || null
		}

		if (input.state !== undefined) {
			updateData.state = input.state?.toUpperCase().trim() || null
		}

		if (input.zipCode !== undefined) {
			if (input.zipCode) {
				const normalizedZipCode = input.zipCode.replace(/\D/g, '')
				if (normalizedZipCode.length !== 8) {
					throw new BadRequestError('CEP inválido. Deve conter 8 dígitos.')
				}
				updateData.zipCode = normalizedZipCode
			} else {
				updateData.zipCode = null
			}
		}

		if (input.bedrooms !== undefined) {
			updateData.bedrooms = input.bedrooms
		}

		if (input.bathrooms !== undefined) {
			updateData.bathrooms = input.bathrooms
		}

		if (input.suites !== undefined) {
			updateData.suites = input.suites
		}

		if (input.parkingSpaces !== undefined) {
			updateData.parkingSpaces = input.parkingSpaces
		}

		if (input.area !== undefined) {
			updateData.area = input.area
		}

		if (input.totalArea !== undefined) {
			updateData.totalArea = input.totalArea
		}

		if (input.builtArea !== undefined) {
			updateData.builtArea = input.builtArea
		}

		if (input.floor !== undefined) {
			updateData.floor = input.floor
		}

		if (input.totalFloors !== undefined) {
			updateData.totalFloors = input.totalFloors
		}

		if (input.yearBuilt !== undefined) {
			updateData.yearBuilt = input.yearBuilt
		}

		if (input.rentalPrice !== undefined) {
			updateData.rentalPrice = input.rentalPrice
		}

		if (input.salePrice !== undefined) {
			updateData.salePrice = input.salePrice
		}

		if (input.iptuPrice !== undefined) {
			updateData.iptuPrice = input.iptuPrice
		}

		if (input.condoFee !== undefined) {
			updateData.condoFee = input.condoFee
		}

		if (input.commissionPercentage !== undefined) {
			updateData.commissionPercentage = input.commissionPercentage
		}

		if (input.commissionValue !== undefined) {
			updateData.commissionValue = input.commissionValue
		}

		if (input.isMarketplace !== undefined) {
			updateData.isMarketplace = input.isMarketplace
		}

		if (input.notes !== undefined) {
			updateData.notes = input.notes?.trim() || null
		}

		if (input.features !== undefined) {
			updateData.features = input.features
		}

		const finalListingType = updateData.listingType ?? property.listingType
		const finalRentalPrice = updateData.rentalPrice ?? property.rentalPrice
		const finalSalePrice = updateData.salePrice ?? property.salePrice

		if (finalListingType === LISTING_TYPES.RENT || finalListingType === LISTING_TYPES.BOTH) {
			if (!finalRentalPrice || finalRentalPrice <= 0) {
				throw new BadRequestError('Valor de locação é obrigatório para imóveis de locação.')
			}
		}

		if (finalListingType === LISTING_TYPES.SALE || finalListingType === LISTING_TYPES.BOTH) {
			if (!finalSalePrice || finalSalePrice <= 0) {
				throw new BadRequestError('Valor de venda é obrigatório para imóveis à venda.')
			}
		}

		if (Object.keys(updateData).length === 0) {
			return property
		}

		try {
			const updatedProperty = await this.propertyRepository.update(input.id, updateData)

			if (!updatedProperty) {
				throw new InternalServerError('Erro ao atualizar imóvel.')
			}

			logger.info(
				{
					propertyId: updatedProperty.id,
					updatedBy: updatedBy.id,
				},
				'Imóvel atualizado com sucesso',
			)

			return updatedProperty
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ForbiddenError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar imóvel')
			throw new InternalServerError('Erro ao atualizar imóvel. Tente novamente.')
		}
	}
}
