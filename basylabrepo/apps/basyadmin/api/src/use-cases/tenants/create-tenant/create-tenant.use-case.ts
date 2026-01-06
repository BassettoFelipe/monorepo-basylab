import { RandomUtils } from '@basylab/core/crypto'
import { BadRequestError, ConflictError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Tenant } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

const logger = createLogger({ service: 'create-tenant-use-case' })

type CreateTenantInput = {
	name: string
	slug: string
	logoUrl?: string
	domain?: string
	description?: string
	settings?: Record<string, unknown>
}

type CreateTenantOutput = Tenant

export class CreateTenantUseCase {
	constructor(private readonly tenantRepository: ITenantRepository) {}

	async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
		const { name, slug, logoUrl, domain, description, settings } = input

		if (!name || name.trim().length === 0) {
			throw new BadRequestError('Nome é obrigatório')
		}

		if (!slug || slug.trim().length === 0) {
			throw new BadRequestError('Slug é obrigatório')
		}

		const normalizedSlug = slug.toLowerCase().trim()

		const existingTenant = await this.tenantRepository.findBySlug(normalizedSlug)
		if (existingTenant) {
			throw new ConflictError('Slug já está em uso')
		}

		const apiKey = RandomUtils.generateApiKey()

		try {
			const tenant = await this.tenantRepository.create({
				name: name.trim(),
				slug: normalizedSlug,
				logoUrl: logoUrl?.trim() || null,
				domain: domain?.trim() || null,
				description: description?.trim() || null,
				settings: settings || {},
				apiKey,
			})

			logger.info({ tenantId: tenant.id, slug: tenant.slug }, 'Tenant criado com sucesso')

			return tenant
		} catch (error) {
			if (error instanceof BadRequestError || error instanceof ConflictError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar tenant')
			throw new InternalServerError('Erro ao criar tenant. Tente novamente.')
		}
	}
}
