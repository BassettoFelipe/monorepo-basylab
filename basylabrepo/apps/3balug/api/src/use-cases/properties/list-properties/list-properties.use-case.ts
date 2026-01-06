import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { ListingType, Property, PropertyStatus, PropertyType } from '@/db/schema/properties'
import type { User } from '@/db/schema/users'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

type ListPropertiesInput = {
	search?: string
	type?: PropertyType
	listingType?: ListingType
	status?: PropertyStatus
	city?: string
	minRentalPrice?: number
	maxRentalPrice?: number
	minSalePrice?: number
	maxSalePrice?: number
	minBedrooms?: number
	maxBedrooms?: number
	limit?: number
	offset?: number
	requestedBy: User
}

type PropertyListItem = Omit<Property, 'createdAt' | 'updatedAt' | 'createdBy' | 'companyId'>

type ListPropertiesOutput = {
	data: PropertyListItem[]
	total: number
	limit: number
	offset: number
}

const ALLOWED_ROLES: UserRole[] = [
	USER_ROLES.OWNER,
	USER_ROLES.MANAGER,
	USER_ROLES.BROKER,
	USER_ROLES.INSURANCE_ANALYST,
]

export class ListPropertiesUseCase {
	constructor(private readonly propertyRepository: IPropertyRepository) {}

	async execute(input: ListPropertiesInput): Promise<ListPropertiesOutput> {
		const currentUser = input.requestedBy

		if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
			throw new ForbiddenError('Você não tem permissão para listar imóveis.')
		}

		if (!currentUser.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada.')
		}

		let brokerId: string | undefined
		if (currentUser.role === USER_ROLES.BROKER) {
			brokerId = currentUser.id
		}

		const result = await this.propertyRepository.list({
			companyId: currentUser.companyId,
			brokerId,
			search: input.search,
			type: input.type,
			listingType: input.listingType,
			status: input.status,
			city: input.city,
			minRentalPrice: input.minRentalPrice,
			maxRentalPrice: input.maxRentalPrice,
			minSalePrice: input.minSalePrice,
			maxSalePrice: input.maxSalePrice,
			minBedrooms: input.minBedrooms,
			maxBedrooms: input.maxBedrooms,
			limit: input.limit ?? 20,
			offset: input.offset ?? 0,
		})

		const cleanData: PropertyListItem[] = result.data.map((property) => {
			const {
				createdAt: _createdAt,
				updatedAt: _updatedAt,
				createdBy: _createdBy,
				companyId: _companyId,
				...rest
			} = property
			return rest
		})

		return {
			data: cleanData,
			total: result.total,
			limit: result.limit,
			offset: result.offset,
		}
	}
}
