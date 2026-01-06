import { BadRequestError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { BillingRecord } from '@/db/schema'
import type { IBillingRepository } from '@/repositories/contracts/billing.repository'

const logger = createLogger({ service: 'create-billing-record-use-case' })

type CreateBillingRecordInput = {
	tenantId: string
	externalCustomerId?: string
	customerEmail?: string
	planSlug?: string
	amountCents: number
	currency?: string
	status: 'paid' | 'pending' | 'failed' | 'refunded'
	paidAt?: Date
	metadata?: Record<string, unknown>
}

type CreateBillingRecordOutput = BillingRecord

export class CreateBillingRecordUseCase {
	constructor(private readonly billingRepository: IBillingRepository) {}

	async execute(input: CreateBillingRecordInput): Promise<CreateBillingRecordOutput> {
		const {
			tenantId,
			externalCustomerId,
			customerEmail,
			planSlug,
			amountCents,
			currency,
			status,
			paidAt,
			metadata,
		} = input

		if (amountCents < 0) {
			throw new BadRequestError('Valor não pode ser negativo')
		}

		try {
			const billingRecord = await this.billingRepository.create({
				tenantId,
				externalCustomerId: externalCustomerId || null,
				customerEmail: customerEmail?.toLowerCase().trim() || null,
				planSlug: planSlug || null,
				amountCents,
				currency: currency || 'BRL',
				status,
				paidAt: status === 'paid' ? paidAt || new Date() : null,
				metadata: metadata || {},
			})

			logger.info(
				{ billingRecordId: billingRecord.id, tenantId, status },
				'Registro de billing criado com sucesso',
			)

			return billingRecord
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar registro de billing')
			throw new InternalServerError('Erro ao criar registro de billing. Tente novamente.')
		}
	}
}
