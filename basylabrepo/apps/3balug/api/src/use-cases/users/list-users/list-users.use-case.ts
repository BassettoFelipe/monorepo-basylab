import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { User } from '@/db/schema/users'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldResponseRepository } from '@/repositories/contracts/custom-field-response.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { UserRole } from '@/types/roles'
import { USER_ROLES } from '@/types/roles'

type ListUsersInput = {
	requestedBy: User // Usuário que está listando
	role?: UserRole | 'all'
	isActive?: boolean
	page?: number
	limit?: number
}

type UserListItem = {
	id: string
	email: string
	name: string
	role: string
	phone: string | null
	isActive: boolean
	isEmailVerified: boolean
	hasPendingCustomFields: boolean
	createdAt: string // Frontend exibe "Data de Cadastro"
}

type ListUsersOutput = {
	users: UserListItem[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export class ListUsersUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly customFieldResponseRepository: ICustomFieldResponseRepository,
	) {}

	async execute(input: ListUsersInput): Promise<ListUsersOutput> {
		if (
			input.requestedBy.role !== USER_ROLES.OWNER &&
			input.requestedBy.role !== USER_ROLES.MANAGER
		) {
			throw new ForbiddenError('Apenas donos da conta e gerentes podem listar usuários')
		}

		if (!input.requestedBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		let users = await this.userRepository.findByCompanyId(input.requestedBy.companyId)

		if (input.role && input.role !== 'all') {
			users = users.filter((u) => u.role === input.role)
		}

		if (input.isActive !== undefined) {
			users = users.filter((u) => u.isActive === input.isActive)
		}

		users = users.filter((u) => u.role !== USER_ROLES.OWNER)

		users = users.filter((u) => u.id !== input.requestedBy.id)

		users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

		const page = input.page || 1
		const limit = input.limit || 20
		const startIndex = (page - 1) * limit
		const endIndex = startIndex + limit
		const paginatedUsers = users.slice(startIndex, endIndex)

		const activeFields = await this.customFieldRepository.findActiveByCompanyId(
			input.requestedBy.companyId,
		)
		const requiredFieldIds = activeFields.filter((f) => f.isRequired).map((f) => f.id)

		const userIds = paginatedUsers.map((u) => u.id)
		const allResponses = await this.customFieldResponseRepository.findByUserIds(userIds)

		const responsesByUserId = new Map<string, Set<string>>()
		for (const response of allResponses) {
			if (!responsesByUserId.has(response.userId)) {
				responsesByUserId.set(response.userId, new Set())
			}
			responsesByUserId.get(response.userId)?.add(response.fieldId)
		}

		const userList: UserListItem[] = paginatedUsers.map((user) => {
			let hasPendingCustomFields = false

			if (requiredFieldIds.length > 0) {
				const respondedFieldIds = responsesByUserId.get(user.id) || new Set()
				hasPendingCustomFields = requiredFieldIds.some((id) => !respondedFieldIds.has(id))
			}

			return {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				phone: user.phone,
				isActive: user.isActive,
				isEmailVerified: user.isEmailVerified,
				hasPendingCustomFields,
				createdAt: user.createdAt.toISOString(),
			}
		})

		return {
			users: userList,
			total: users.length,
			page,
			limit,
			totalPages: Math.ceil(users.length / limit),
		}
	}
}
