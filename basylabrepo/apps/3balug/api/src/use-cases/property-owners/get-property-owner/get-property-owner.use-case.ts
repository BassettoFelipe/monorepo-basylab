import { ForbiddenError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import type { User } from '@/db/schema/users'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

type GetPropertyOwnerInput = {
	id: string
	requestedBy: User
}

type GetPropertyOwnerOutput = {
	id: string
	name: string
	document: string
	companyId: string
	documentType: string
	rg: string | null
	nationality: string | null
	maritalStatus: string | null
	profession: string | null
	email: string | null
	phone: string | null
	phoneSecondary: string | null
	birthDate: string | null
	address: string | null
	addressNumber: string | null
	addressComplement: string | null
	neighborhood: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	photoUrl: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

const ALLOWED_ROLES: UserRole[] = [
	USER_ROLES.OWNER,
	USER_ROLES.MANAGER,
	USER_ROLES.BROKER,
	USER_ROLES.INSURANCE_ANALYST,
]

export class GetPropertyOwnerUseCase {
	constructor(private readonly propertyOwnerRepository: IPropertyOwnerRepository) {}

	async execute(input: GetPropertyOwnerInput): Promise<GetPropertyOwnerOutput> {
		const currentUser = input.requestedBy

		if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
			throw new ForbiddenError('Você não tem permissão para visualizar proprietários.')
		}

		if (!currentUser.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada.')
		}

		const propertyOwner = await this.propertyOwnerRepository.findById(input.id)

		if (!propertyOwner || propertyOwner.companyId !== currentUser.companyId) {
			throw new NotFoundError('Proprietário não encontrado.')
		}

		if (currentUser.role === USER_ROLES.BROKER && propertyOwner.createdBy !== currentUser.id) {
			throw new ForbiddenError('Você só pode visualizar proprietários que você cadastrou.')
		}

		return {
			id: propertyOwner.id,
			name: propertyOwner.name,
			document: propertyOwner.document,
			companyId: propertyOwner.companyId,
			documentType: propertyOwner.documentType,
			rg: propertyOwner.rg,
			nationality: propertyOwner.nationality,
			maritalStatus: propertyOwner.maritalStatus,
			profession: propertyOwner.profession,
			email: propertyOwner.email,
			phone: propertyOwner.phone,
			phoneSecondary: propertyOwner.phoneSecondary,
			birthDate: propertyOwner.birthDate,
			address: propertyOwner.address,
			addressNumber: propertyOwner.addressNumber,
			addressComplement: propertyOwner.addressComplement,
			neighborhood: propertyOwner.neighborhood,
			city: propertyOwner.city,
			state: propertyOwner.state,
			zipCode: propertyOwner.zipCode,
			photoUrl: propertyOwner.photoUrl,
			notes: propertyOwner.notes,
			createdAt: propertyOwner.createdAt.toISOString(),
			updatedAt: propertyOwner.updatedAt.toISOString(),
		}
	}
}
