import { beforeEach, describe, expect, it } from 'bun:test'
import { BadRequestError } from '@basylab/core/errors'
import { InMemoryEventRepository, InMemoryTenantRepository } from '@/test/in-memory-repositories'
import { createTestEvent, createTestTenant } from '@/test/test-helpers'
import { AggregateEventsUseCase } from '../aggregate-events/aggregate-events.use-case'
import { CreateEventUseCase } from '../create-event/create-event.use-case'
import { CreateEventsBatchUseCase } from '../create-events-batch/create-events-batch.use-case'
import { ListEventsUseCase } from '../list-events/list-events.use-case'

describe('Event Use Cases', () => {
	let eventRepository: InMemoryEventRepository
	let tenantRepository: InMemoryTenantRepository
	let tenant: ReturnType<typeof createTestTenant>

	beforeEach(() => {
		eventRepository = new InMemoryEventRepository()
		tenantRepository = new InMemoryTenantRepository()

		tenant = createTestTenant()
		tenantRepository.seed([tenant])
	})

	describe('CreateEventUseCase', () => {
		it('should create an event successfully', async () => {
			const useCase = new CreateEventUseCase(eventRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				eventName: 'page_view',
				userId: 'user-123',
				properties: { page: '/home' },
			})

			expect(result.id).toBeDefined()
			expect(result.tenantId).toBe(tenant.id)
			expect(result.eventName).toBe('page_view')
			expect(result.userId).toBe('user-123')
			expect(result.properties).toEqual({ page: '/home' })
		})

		it('should create event without userId', async () => {
			const useCase = new CreateEventUseCase(eventRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				eventName: 'anonymous_event',
			})

			expect(result.userId).toBeNull()
		})

		it('should throw BadRequestError when eventName is empty', async () => {
			const useCase = new CreateEventUseCase(eventRepository)

			await expect(
				useCase.execute({
					tenantId: tenant.id,
					eventName: '',
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('CreateEventsBatchUseCase', () => {
		it('should create multiple events in batch', async () => {
			const useCase = new CreateEventsBatchUseCase(eventRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				events: [
					{ eventName: 'event_1', userId: 'user-1' },
					{ eventName: 'event_2', userId: 'user-2' },
					{ eventName: 'event_3' },
				],
			})

			expect(result).toHaveLength(3)
		})

		it('should throw BadRequestError when events array is empty', async () => {
			const useCase = new CreateEventsBatchUseCase(eventRepository)

			await expect(
				useCase.execute({
					tenantId: tenant.id,
					events: [],
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('ListEventsUseCase', () => {
		it('should list events for a tenant as owner', async () => {
			const event1 = createTestEvent(tenant.id, { eventName: 'event_1' })
			const event2 = createTestEvent(tenant.id, { eventName: 'event_2' })
			eventRepository.seed([event1, event2])

			const useCase = new ListEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('should filter events by eventName', async () => {
			const event1 = createTestEvent(tenant.id, { eventName: 'page_view' })
			const event2 = createTestEvent(tenant.id, { eventName: 'click' })
			eventRepository.seed([event1, event2])

			const useCase = new ListEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
				eventName: 'page_view',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].eventName).toBe('page_view')
		})

		it('should filter events by eventUserId', async () => {
			const event1 = createTestEvent(tenant.id, { userId: 'user-1' })
			const event2 = createTestEvent(tenant.id, { userId: 'user-2' })
			eventRepository.seed([event1, event2])

			const useCase = new ListEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
				eventUserId: 'user-1',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].userId).toBe('user-1')
		})

		it('should filter events by date range', async () => {
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

			const event1 = createTestEvent(tenant.id, { createdAt: now })
			const event2 = createTestEvent(tenant.id, { createdAt: twoDaysAgo })
			eventRepository.seed([event1, event2])

			const useCase = new ListEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
				startDate: yesterday,
			})

			expect(result.data).toHaveLength(1)
		})

		it('should apply pagination', async () => {
			const events = Array.from({ length: 5 }, (_, i) =>
				createTestEvent(tenant.id, { eventName: `event_${i}` }),
			)
			eventRepository.seed(events)

			const useCase = new ListEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
				limit: 2,
				offset: 0,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(5)
		})

		it('should return empty for manager without access', async () => {
			const event = createTestEvent(tenant.id, { eventName: 'event_1' })
			eventRepository.seed([event])

			const useCase = new ListEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'manager',
				userId: 'manager-without-access',
				tenantId: tenant.id,
			})

			expect(result.data).toHaveLength(0)
		})
	})

	describe('AggregateEventsUseCase', () => {
		it('should aggregate events by name as owner', async () => {
			const events = [
				createTestEvent(tenant.id, { eventName: 'page_view', userId: 'user-1' }),
				createTestEvent(tenant.id, { eventName: 'page_view', userId: 'user-2' }),
				createTestEvent(tenant.id, { eventName: 'page_view', userId: 'user-1' }),
				createTestEvent(tenant.id, { eventName: 'click', userId: 'user-1' }),
			]
			eventRepository.seed(events)

			const useCase = new AggregateEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
			})

			expect(result).toHaveLength(2)

			const pageViewAgg = result.find((a) => a.eventName === 'page_view')
			expect(pageViewAgg?.count).toBe(3)
			expect(pageViewAgg?.uniqueUsers).toBe(2)

			const clickAgg = result.find((a) => a.eventName === 'click')
			expect(clickAgg?.count).toBe(1)
			expect(clickAgg?.uniqueUsers).toBe(1)
		})

		it('should aggregate events within date range', async () => {
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

			const events = [
				createTestEvent(tenant.id, { eventName: 'page_view', createdAt: now }),
				createTestEvent(tenant.id, { eventName: 'page_view', createdAt: twoDaysAgo }),
			]
			eventRepository.seed(events)

			const useCase = new AggregateEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-123',
				tenantId: tenant.id,
				startDate: yesterday,
			})

			const pageViewAgg = result.find((a) => a.eventName === 'page_view')
			expect(pageViewAgg?.count).toBe(1)
		})

		it('should throw BadRequestError when tenantId is missing', async () => {
			const useCase = new AggregateEventsUseCase(eventRepository, tenantRepository)

			await expect(
				useCase.execute({
					userRole: 'owner',
					userId: 'owner-123',
					tenantId: '',
				}),
			).rejects.toThrow(BadRequestError)
		})

		it('should return empty for manager without access', async () => {
			const event = createTestEvent(tenant.id, { eventName: 'page_view' })
			eventRepository.seed([event])

			const useCase = new AggregateEventsUseCase(eventRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'manager',
				userId: 'manager-without-access',
				tenantId: tenant.id,
			})

			expect(result).toHaveLength(0)
		})
	})
})
