import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Plan } from '@/db/schema'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'

const logger = createLogger({ service: 'update-plan-use-case' })

type UpdatePlanInput = {
	planId: string
	tenantId: string
	name?: string
	slug?: string
	description?: string
	priceCents?: number
	currency?: string
	billingInterval?: 'monthly' | 'yearly'
	isActive?: boolean
	displayOrder?: number
}

type UpdatePlanOutput = Plan

export class UpdatePlanUseCase {
	constructor(private readonly planRepository: IPlanRepository) {}

	async execute(input: UpdatePlanInput): Promise<UpdatePlanOutput> {
		const {
			planId,
			tenantId,
			name,
			slug,
			description,
			priceCents,
			currency,
			billingInterval,
			isActive,
			displayOrder,
		} = input

		const plan = await this.planRepository.findById(planId)

		if (!plan || plan.tenantId !== tenantId) {
			throw new NotFoundError('Plano não encontrado')
		}

		if (slug && slug !== plan.slug) {
			const normalizedSlug = slug.toLowerCase().trim()
			const existingPlan = await this.planRepository.findByTenantAndSlug(tenantId, normalizedSlug)
			if (existingPlan) {
				throw new ConflictError('Slug já está em uso neste tenant')
			}
		}

		if (priceCents !== undefined && priceCents < 0) {
			throw new BadRequestError('Preço não pode ser negativo')
		}

		try {
			const updateData: Record<string, unknown> = {}

			if (name !== undefined) updateData.name = name.trim()
			if (slug !== undefined) updateData.slug = slug.toLowerCase().trim()
			if (description !== undefined) updateData.description = description?.trim() || null
			if (priceCents !== undefined) updateData.priceCents = priceCents
			if (currency !== undefined) updateData.currency = currency
			if (billingInterval !== undefined) updateData.billingInterval = billingInterval
			if (isActive !== undefined) updateData.isActive = isActive
			if (displayOrder !== undefined) updateData.displayOrder = displayOrder

			const updatedPlan = await this.planRepository.update(planId, updateData)

			if (!updatedPlan) {
				throw new NotFoundError('Plano não encontrado')
			}

			logger.info({ planId: updatedPlan.id, tenantId }, 'Plano atualizado com sucesso')

			return updatedPlan
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar plano')
			throw new InternalServerError('Erro ao atualizar plano. Tente novamente.')
		}
	}
}
