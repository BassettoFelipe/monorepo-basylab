import { logger } from '@/config/logger'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'

export class CleanupExpiredPaymentsJob {
	constructor(private readonly pendingPaymentRepository: IPendingPaymentRepository) {}

	async execute(): Promise<void> {
		try {
			logger.info('Starting cleanup of expired pending payments')

			const twentyFourHoursAgo = new Date()
			twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

			const deletedCount = await this.pendingPaymentRepository.deleteExpired(twentyFourHoursAgo)

			logger.info({
				msg: 'Cleanup of expired pending payments completed',
				deletedCount,
			})
		} catch (error) {
			logger.error({
				msg: 'Error cleaning up expired pending payments',
				error: error instanceof Error ? error.message : String(error),
			})
		}
	}
}
