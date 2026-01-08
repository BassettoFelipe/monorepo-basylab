import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { User } from '@/db/schema/users'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

type ListPropertyOwnersInput = {
	search?: string
	limit?: number
	offset?: number
	requestedBy: User
}

type PropertyOwnerListItem = Omit<PropertyOwner, 'updatedAt' | 'createdBy' | 'companyId'> & {
	propertiesCount?: number
}

type ListPropertyOwnersOutput = {
	data: PropertyOwnerListItem[]
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

export class ListPropertyOwnersUseCase {
	constructor(private readonly propertyOwnerRepository: IPropertyOwnerRepository) {}

	async execute(input: ListPropertyOwnersInput): Promise<ListPropertyOwnersOutput> {
		const currentUser = input.requestedBy

		if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
			throw new ForbiddenError('Você não tem permissão para listar proprietários.')
		}

		if (!currentUser.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada.')
		}

		let createdBy: string | undefined
		if (currentUser.role === USER_ROLES.BROKER) {
			createdBy = currentUser.id
		}

		const result = await this.propertyOwnerRepository.list({
			companyId: currentUser.companyId,
			search: input.search,
			createdBy,
			limit: input.limit ?? 20,
			offset: input.offset ?? 0,
		})

		const cleanData: PropertyOwnerListItem[] = result.data.map((owner) => {
			const { updatedAt: _updatedAt, createdBy: _createdBy, companyId: _companyId, ...rest } = owner
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
