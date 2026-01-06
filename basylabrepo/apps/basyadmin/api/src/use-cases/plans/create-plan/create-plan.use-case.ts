import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Plan } from '@/db/schema'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

const logger = createLogger({ service: 'create-plan-use-case' })

type CreatePlanInput = {
	tenantId: string
	name: string
	slug: string
	description?: string
	priceCents: number
	currency?: string
	billingInterval?: 'monthly' | 'yearly'
	displayOrder?: number
}

type CreatePlanOutput = Plan

export class CreatePlanUseCase {
	constructor(
		private readonly planRepository: IPlanRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: CreatePlanInput): Promise<CreatePlanOutput> {
		const {
			tenantId,
			name,
			slug,
			description,
			priceCents,
			currency,
			billingInterval,
			displayOrder,
		} = input

		const tenant = await this.tenantRepository.findById(tenantId)
		if (!tenant) {
			throw new NotFoundError('Tenant não encontrado')
		}

		if (!name || name.trim().length === 0) {
			throw new BadRequestError('Nome é obrigatório')
		}

		if (!slug || slug.trim().length === 0) {
			throw new BadRequestError('Slug é obrigatório')
		}

		if (priceCents < 0) {
			throw new BadRequestError('Preço não pode ser negativo')
		}

		const normalizedSlug = slug.toLowerCase().trim()

		const existingPlan = await this.planRepository.findByTenantAndSlug(tenantId, normalizedSlug)
		if (existingPlan) {
			throw new ConflictError('Slug já está em uso neste tenant')
		}

		try {
			const plan = await this.planRepository.create({
				tenantId,
				name: name.trim(),
				slug: normalizedSlug,
				description: description?.trim() || null,
				priceCents,
				currency: currency || 'BRL',
				billingInterval: billingInterval || 'monthly',
				displayOrder: displayOrder || 0,
			})

			logger.info({ planId: plan.id, tenantId, slug: plan.slug }, 'Plano criado com sucesso')

			return plan
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar plano')
			throw new InternalServerError('Erro ao criar plano. Tente novamente.')
		}
	}
}
