import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const logger = createLogger({ service: 'remove-tenant-use-case' })

type RemoveTenantInput = {
	managerId: string
	tenantId: string
}

type RemoveTenantOutput = {
	success: boolean
}

export class RemoveTenantUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: RemoveTenantInput): Promise<RemoveTenantOutput> {
		const { managerId, tenantId } = input

		const manager = await this.userRepository.findById(managerId)

		if (!manager || manager.role !== 'manager') {
			throw new NotFoundError('Manager não encontrado')
		}

		try {
			await this.tenantRepository.removeManager(tenantId, managerId)

			logger.info({ managerId, tenantId }, 'Tenant removido do manager com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao remover tenant do manager')
			throw new InternalServerError('Erro ao remover tenant. Tente novamente.')
		}
	}
}
