import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { Contract, ContractStatus } from '@/db/schema/contracts'
import type { User } from '@/db/schema/users'
import type { IContractRepository } from '@/repositories/contracts/contract.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

type ListContractsInput = {
	propertyId?: string
	tenantId?: string
	ownerId?: string
	status?: ContractStatus
	startDateFrom?: Date
	startDateTo?: Date
	endDateFrom?: Date
	endDateTo?: Date
	limit?: number
	offset?: number
	requestedBy: User
}

type ContractListItem = Omit<Contract, 'createdAt' | 'updatedAt' | 'createdBy' | 'companyId'>

type ListContractsOutput = {
	data: ContractListItem[]
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

export class ListContractsUseCase {
	constructor(private readonly contractRepository: IContractRepository) {}

	async execute(input: ListContractsInput): Promise<ListContractsOutput> {
		const currentUser = input.requestedBy

		if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
			throw new ForbiddenError('Você não tem permissão para listar contratos.')
		}

		if (!currentUser.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada.')
		}

		let brokerId: string | undefined
		if (currentUser.role === USER_ROLES.BROKER) {
			brokerId = currentUser.id
		}

		const result = await this.contractRepository.list({
			companyId: currentUser.companyId,
			brokerId,
			propertyId: input.propertyId,
			tenantId: input.tenantId,
			ownerId: input.ownerId,
			status: input.status,
			startDateFrom: input.startDateFrom,
			startDateTo: input.startDateTo,
			endDateFrom: input.endDateFrom,
			endDateTo: input.endDateTo,
			limit: input.limit ?? 20,
			offset: input.offset ?? 0,
		})

		const cleanData: ContractListItem[] = result.data.map((contract) => {
			const {
				createdAt: _createdAt,
				updatedAt: _updatedAt,
				createdBy: _createdBy,
				companyId: _companyId,
				...rest
			} = contract
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
