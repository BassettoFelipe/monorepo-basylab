import { RandomUtils } from '@basylab/core/crypto'
import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

const logger = createLogger({ service: 'regenerate-api-key-use-case' })

type RegenerateApiKeyInput = {
	tenantId: string
}

type RegenerateApiKeyOutput = {
	apiKey: string
}

export class RegenerateApiKeyUseCase {
	constructor(private readonly tenantRepository: ITenantRepository) {}

	async execute(input: RegenerateApiKeyInput): Promise<RegenerateApiKeyOutput> {
		const { tenantId } = input

		const tenant = await this.tenantRepository.findById(tenantId)

		if (!tenant) {
			throw new NotFoundError('Tenant não encontrado')
		}

		try {
			const apiKey = RandomUtils.generateApiKey()

			const updatedTenant = await this.tenantRepository.update(tenantId, {
				apiKey,
				apiKeyCreatedAt: new Date(),
			})

			if (!updatedTenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			logger.info({ tenantId }, 'API Key regenerada com sucesso')

			return { apiKey: updatedTenant.apiKey }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao regenerar API Key')
			throw new InternalServerError('Erro ao regenerar API Key. Tente novamente.')
		}
	}
}
