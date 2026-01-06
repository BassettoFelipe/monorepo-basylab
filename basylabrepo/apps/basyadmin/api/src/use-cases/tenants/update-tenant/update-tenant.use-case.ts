import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Tenant } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

const logger = createLogger({ service: 'update-tenant-use-case' })

type UpdateTenantInput = {
	tenantId: string
	name?: string
	slug?: string
	logoUrl?: string
	domain?: string
	description?: string
	settings?: Record<string, unknown>
	isActive?: boolean
}

type UpdateTenantOutput = Tenant

export class UpdateTenantUseCase {
	constructor(private readonly tenantRepository: ITenantRepository) {}

	async execute(input: UpdateTenantInput): Promise<UpdateTenantOutput> {
		const { tenantId, name, slug, logoUrl, domain, description, settings, isActive } = input

		const tenant = await this.tenantRepository.findById(tenantId)

		if (!tenant) {
			throw new NotFoundError('Tenant não encontrado')
		}

		if (slug && slug !== tenant.slug) {
			const normalizedSlug = slug.toLowerCase().trim()
			const existingTenant = await this.tenantRepository.findBySlug(normalizedSlug)
			if (existingTenant) {
				throw new ConflictError('Slug já está em uso')
			}
		}

		try {
			const updateData: Record<string, unknown> = {}

			if (name !== undefined) updateData.name = name.trim()
			if (slug !== undefined) updateData.slug = slug.toLowerCase().trim()
			if (logoUrl !== undefined) updateData.logoUrl = logoUrl?.trim() || null
			if (domain !== undefined) updateData.domain = domain?.trim() || null
			if (description !== undefined) updateData.description = description?.trim() || null
			if (settings !== undefined) updateData.settings = settings
			if (isActive !== undefined) updateData.isActive = isActive

			const updatedTenant = await this.tenantRepository.update(tenantId, updateData)

			if (!updatedTenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			logger.info({ tenantId: updatedTenant.id }, 'Tenant atualizado com sucesso')

			return updatedTenant
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar tenant')
			throw new InternalServerError('Erro ao atualizar tenant. Tente novamente.')
		}
	}
}
