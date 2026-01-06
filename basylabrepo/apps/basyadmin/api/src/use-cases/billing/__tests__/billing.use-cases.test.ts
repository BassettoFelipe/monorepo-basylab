import { beforeEach, describe, expect, it } from 'bun:test'
import { BadRequestError } from '@basylab/core/errors'
import { InMemoryBillingRepository, InMemoryTenantRepository } from '@/test/in-memory-repositories'
import { createTestBillingRecord, createTestTenant } from '@/test/test-helpers'
import { CreateBillingRecordUseCase } from '../create-billing-record/create-billing-record.use-case'
import { GetBillingStatsUseCase } from '../get-billing-stats/get-billing-stats.use-case'
import { ListBillingRecordsUseCase } from '../list-billing-records/list-billing-records.use-case'

describe('Billing Use Cases', () => {
	let billingRepository: InMemoryBillingRepository
	let tenantRepository: InMemoryTenantRepository
	let tenant: ReturnType<typeof createTestTenant>

	beforeEach(() => {
		billingRepository = new InMemoryBillingRepository()
		tenantRepository = new InMemoryTenantRepository()

		tenant = createTestTenant()
		tenantRepository.seed([tenant])
	})

	describe('CreateBillingRecordUseCase', () => {
		it('should create a billing record successfully', async () => {
			const useCase = new CreateBillingRecordUseCase(billingRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				amountCents: 9900,
				status: 'paid',
				customerEmail: 'customer@example.com',
				planSlug: 'basic',
			})

			expect(result.id).toBeDefined()
			expect(result.tenantId).toBe(tenant.id)
			expect(result.amountCents).toBe(9900)
			expect(result.status).toBe('paid')
			expect(result.customerEmail).toBe('customer@example.com')
		})

		it('should create billing record with pending status', async () => {
			const useCase = new CreateBillingRecordUseCase(billingRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				amountCents: 9900,
				status: 'pending',
			})

			expect(result.status).toBe('pending')
			expect(result.paidAt).toBeNull()
		})

		it('should throw BadRequestError when amount is negative', async () => {
			const useCase = new CreateBillingRecordUseCase(billingRepository)

			await expect(
				useCase.execute({
					tenantId: tenant.id,
					amountCents: -100,
					status: 'paid',
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('ListBillingRecordsUseCase', () => {
		it('should list billing records for owner', async () => {
			const record1 = createTestBillingRecord(tenant.id, { amountCents: 9900 })
			const record2 = createTestBillingRecord(tenant.id, { amountCents: 19900 })
			billingRepository.seed([record1, record2])

			const useCase = new ListBillingRecordsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('should filter billing records by status', async () => {
			const paidRecord = createTestBillingRecord(tenant.id, { status: 'paid' })
			const pendingRecord = createTestBillingRecord(tenant.id, { status: 'pending' })
			billingRepository.seed([paidRecord, pendingRecord])

			const useCase = new ListBillingRecordsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
				status: 'paid',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].status).toBe('paid')
		})

		it('should filter billing records by date range', async () => {
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

			const record1 = createTestBillingRecord(tenant.id, { createdAt: now })
			const record2 = createTestBillingRecord(tenant.id, { createdAt: twoDaysAgo })
			billingRepository.seed([record1, record2])

			const useCase = new ListBillingRecordsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
				startDate: yesterday,
			})

			expect(result.data).toHaveLength(1)
		})

		it('should apply pagination', async () => {
			const records = Array.from({ length: 5 }, (_, i) =>
				createTestBillingRecord(tenant.id, { amountCents: (i + 1) * 1000 }),
			)
			billingRepository.seed(records)

			const useCase = new ListBillingRecordsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
				limit: 2,
				offset: 0,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(5)
		})
	})

	describe('GetBillingStatsUseCase', () => {
		it('should get billing stats for a tenant', async () => {
			const records = [
				createTestBillingRecord(tenant.id, { amountCents: 9900, status: 'paid' }),
				createTestBillingRecord(tenant.id, { amountCents: 19900, status: 'paid' }),
				createTestBillingRecord(tenant.id, { amountCents: 5000, status: 'failed' }),
				createTestBillingRecord(tenant.id, { amountCents: 10000, status: 'pending' }),
			]
			billingRepository.seed(records)

			const useCase = new GetBillingStatsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
			})

			expect(result.totalRevenue).toBe(9900 + 19900 + 5000 + 10000)
			expect(result.totalTransactions).toBe(4)
			expect(result.paidTransactions).toBe(2)
			expect(result.failedTransactions).toBe(1)
		})

		it('should get billing stats with date filter', async () => {
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

			const records = [
				createTestBillingRecord(tenant.id, { amountCents: 9900, status: 'paid', createdAt: now }),
				createTestBillingRecord(tenant.id, {
					amountCents: 19900,
					status: 'paid',
					createdAt: twoDaysAgo,
				}),
			]
			billingRepository.seed(records)

			const useCase = new GetBillingStatsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
				startDate: yesterday,
			})

			expect(result.totalRevenue).toBe(9900)
			expect(result.paidTransactions).toBe(1)
		})

		it('should get global billing stats when no tenant specified', async () => {
			const tenant2 = createTestTenant({ slug: 'tenant-2' })
			tenantRepository.seed([tenant2])

			const records = [
				createTestBillingRecord(tenant.id, { amountCents: 9900, status: 'paid' }),
				createTestBillingRecord(tenant2.id, { amountCents: 19900, status: 'paid' }),
			]
			billingRepository.seed(records)

			const useCase = new GetBillingStatsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
			})

			expect(result.totalRevenue).toBe(9900 + 19900)
			expect(result.totalTransactions).toBe(2)
		})

		it('should include MRR and ARR', async () => {
			const now = new Date()
			const records = [
				createTestBillingRecord(tenant.id, { amountCents: 9900, status: 'paid', paidAt: now }),
			]
			billingRepository.seed(records)

			const useCase = new GetBillingStatsUseCase(billingRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
			})

			expect(result.mrr).toBeDefined()
			expect(result.arr).toBe(result.mrr * 12)
		})
	})
})
