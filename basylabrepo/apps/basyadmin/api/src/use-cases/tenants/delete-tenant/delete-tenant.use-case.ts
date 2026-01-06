import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

const logger = createLogger({ service: 'delete-tenant-use-case' })

type DeleteTenantInput = {
	tenantId: string
}

type DeleteTenantOutput = {
	success: boolean
}

export class DeleteTenantUseCase {
	constructor(private readonly tenantRepository: ITenantRepository) {}

	async execute(input: DeleteTenantInput): Promise<DeleteTenantOutput> {
		const { tenantId } = input

		const tenant = await this.tenantRepository.findById(tenantId)

		if (!tenant) {
			throw new NotFoundError('Tenant não encontrado')
		}

		try {
			const deleted = await this.tenantRepository.delete(tenantId)

			if (!deleted) {
				throw new NotFoundError('Tenant não encontrado')
			}

			logger.info({ tenantId, slug: tenant.slug }, 'Tenant deletado com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao deletar tenant')
			throw new InternalServerError('Erro ao deletar tenant. Tente novamente.')
		}
	}
}
