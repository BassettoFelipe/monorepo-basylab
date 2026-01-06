import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const logger = createLogger({ service: 'assign-tenant-use-case' })

type AssignTenantInput = {
	managerId: string
	tenantId: string
}

type AssignTenantOutput = {
	success: boolean
}

export class AssignTenantUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: AssignTenantInput): Promise<AssignTenantOutput> {
		const { managerId, tenantId } = input

		const manager = await this.userRepository.findById(managerId)

		if (!manager || manager.role !== 'manager') {
			throw new NotFoundError('Manager não encontrado')
		}

		const tenant = await this.tenantRepository.findById(tenantId)

		if (!tenant) {
			throw new NotFoundError('Tenant não encontrado')
		}

		try {
			await this.tenantRepository.assignManager(tenantId, managerId)

			logger.info({ managerId, tenantId }, 'Tenant atribuído ao manager com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atribuir tenant ao manager')
			throw new InternalServerError('Erro ao atribuir tenant. Tente novamente.')
		}
	}
}
