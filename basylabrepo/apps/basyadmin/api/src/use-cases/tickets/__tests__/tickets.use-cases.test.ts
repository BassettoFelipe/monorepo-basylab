import { beforeEach, describe, expect, it } from 'bun:test'
import { BadRequestError, NotFoundError } from '@basylab/core/errors'
import { InMemoryTenantRepository, InMemoryTicketRepository } from '@/test/in-memory-repositories'
import { createTestTenant, createTestTicket } from '@/test/test-helpers'
import { AddTicketMessageUseCase } from '../add-ticket-message/add-ticket-message.use-case'
import { CreateTicketUseCase } from '../create-ticket/create-ticket.use-case'
import { GetTicketUseCase } from '../get-ticket/get-ticket.use-case'
import { ListTicketsUseCase } from '../list-tickets/list-tickets.use-case'
import { UpdateTicketUseCase } from '../update-ticket/update-ticket.use-case'

describe('Ticket Use Cases', () => {
	let ticketRepository: InMemoryTicketRepository
	let tenantRepository: InMemoryTenantRepository
	let tenant: ReturnType<typeof createTestTenant>

	beforeEach(() => {
		ticketRepository = new InMemoryTicketRepository()
		tenantRepository = new InMemoryTenantRepository()

		tenant = createTestTenant()
		tenantRepository.seed([tenant])
	})

	describe('CreateTicketUseCase', () => {
		it('should create a ticket successfully', async () => {
			const useCase = new CreateTicketUseCase(ticketRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				title: 'Test Ticket',
				description: 'Test description',
				externalUserEmail: 'user@example.com',
				priority: 'high',
			})

			expect(result.id).toBeDefined()
			expect(result.tenantId).toBe(tenant.id)
			expect(result.title).toBe('Test Ticket')
			expect(result.priority).toBe('high')
			expect(result.status).toBe('open')
		})

		it('should create ticket with default priority', async () => {
			const useCase = new CreateTicketUseCase(ticketRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				title: 'Test Ticket',
			})

			expect(result.priority).toBe('medium')
		})

		it('should throw BadRequestError when title is empty', async () => {
			const useCase = new CreateTicketUseCase(ticketRepository)

			await expect(
				useCase.execute({
					tenantId: tenant.id,
					title: '',
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('ListTicketsUseCase', () => {
		it('should list all tickets for owner', async () => {
			const ticket1 = createTestTicket(tenant.id, { title: 'Ticket 1' })
			const ticket2 = createTestTicket(tenant.id, { title: 'Ticket 2' })
			ticketRepository.seed([ticket1, ticket2])

			const useCase = new ListTicketsUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('should filter tickets by status', async () => {
			const openTicket = createTestTicket(tenant.id, { status: 'open' })
			const resolvedTicket = createTestTicket(tenant.id, { status: 'resolved' })
			ticketRepository.seed([openTicket, resolvedTicket])

			const useCase = new ListTicketsUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
				status: 'open',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].status).toBe('open')
		})

		it('should filter tickets by priority', async () => {
			const highPriority = createTestTicket(tenant.id, { priority: 'high' })
			const lowPriority = createTestTicket(tenant.id, { priority: 'low' })
			ticketRepository.seed([highPriority, lowPriority])

			const useCase = new ListTicketsUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				tenantId: tenant.id,
				priority: 'high',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].priority).toBe('high')
		})

		it('should list only managed tenants tickets for manager', async () => {
			const tenant2 = createTestTenant({ slug: 'tenant-2' })
			tenantRepository.seed([tenant2])

			const ticket1 = createTestTicket(tenant.id, { title: 'Ticket 1' })
			const ticket2 = createTestTicket(tenant2.id, { title: 'Ticket 2' })
			ticketRepository.seed([ticket1, ticket2])

			const managerId = 'manager-id'
			await tenantRepository.assignManager(tenant.id, managerId)

			const useCase = new ListTicketsUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				userRole: 'manager',
				userId: managerId,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].tenantId).toBe(tenant.id)
		})

		it('should apply pagination', async () => {
			const tickets = Array.from({ length: 5 }, (_, i) =>
				createTestTicket(tenant.id, { title: `Ticket ${i}` }),
			)
			ticketRepository.seed(tickets)

			const useCase = new ListTicketsUseCase(ticketRepository, tenantRepository)

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

	describe('GetTicketUseCase', () => {
		it('should get ticket by id for owner', async () => {
			const ticket = createTestTicket(tenant.id, { title: 'Test Ticket' })
			ticketRepository.seed([ticket])

			const useCase = new GetTicketUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				userRole: 'owner',
				userId: 'owner-id',
			})

			expect(result.id).toBe(ticket.id)
			expect(result.title).toBe('Test Ticket')
		})

		it('should get ticket with messages', async () => {
			const ticket = createTestTicket(tenant.id, { title: 'Test Ticket' })
			ticketRepository.seed([ticket])

			await ticketRepository.addMessage({
				ticketId: ticket.id,
				senderType: 'user',
				content: 'Test message',
			})

			const useCase = new GetTicketUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				userRole: 'owner',
				userId: 'owner-id',
			})

			expect(result.messages).toHaveLength(1)
			expect(result.messages[0].content).toBe('Test message')
		})

		it('should get ticket for manager with access', async () => {
			const ticket = createTestTicket(tenant.id, { title: 'Test Ticket' })
			ticketRepository.seed([ticket])

			const managerId = 'manager-id'
			await tenantRepository.assignManager(tenant.id, managerId)

			const useCase = new GetTicketUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				userRole: 'manager',
				userId: managerId,
			})

			expect(result.id).toBe(ticket.id)
		})

		it('should throw NotFoundError when ticket does not exist', async () => {
			const useCase = new GetTicketUseCase(ticketRepository, tenantRepository)

			await expect(
				useCase.execute({
					ticketId: 'non-existent-id',
					userRole: 'owner',
					userId: 'owner-id',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when manager has no access', async () => {
			const ticket = createTestTicket(tenant.id, { title: 'Test Ticket' })
			ticketRepository.seed([ticket])

			const useCase = new GetTicketUseCase(ticketRepository, tenantRepository)

			await expect(
				useCase.execute({
					ticketId: ticket.id,
					userRole: 'manager',
					userId: 'manager-without-access',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('UpdateTicketUseCase', () => {
		it('should update ticket successfully for owner', async () => {
			const ticket = createTestTicket(tenant.id, { status: 'open' })
			ticketRepository.seed([ticket])

			const useCase = new UpdateTicketUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				userRole: 'owner',
				userId: 'owner-id',
				status: 'in_progress',
			})

			expect(result.status).toBe('in_progress')
		})

		it('should update ticket priority', async () => {
			const ticket = createTestTicket(tenant.id, { priority: 'medium' })
			ticketRepository.seed([ticket])

			const useCase = new UpdateTicketUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				userRole: 'owner',
				userId: 'owner-id',
				priority: 'urgent',
			})

			expect(result.priority).toBe('urgent')
		})

		it('should set resolvedAt when status is resolved', async () => {
			const ticket = createTestTicket(tenant.id, { status: 'open' })
			ticketRepository.seed([ticket])

			const useCase = new UpdateTicketUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				userRole: 'owner',
				userId: 'owner-id',
				status: 'resolved',
			})

			expect(result.status).toBe('resolved')
			expect(result.resolvedAt).toBeDefined()
		})

		it('should throw NotFoundError when ticket does not exist', async () => {
			const useCase = new UpdateTicketUseCase(ticketRepository, tenantRepository)

			await expect(
				useCase.execute({
					ticketId: 'non-existent-id',
					userRole: 'owner',
					userId: 'owner-id',
					status: 'in_progress',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when manager has no access', async () => {
			const ticket = createTestTicket(tenant.id, { status: 'open' })
			ticketRepository.seed([ticket])

			const useCase = new UpdateTicketUseCase(ticketRepository, tenantRepository)

			await expect(
				useCase.execute({
					ticketId: ticket.id,
					userRole: 'manager',
					userId: 'manager-without-access',
					status: 'in_progress',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('AddTicketMessageUseCase', () => {
		it('should add message to ticket', async () => {
			const ticket = createTestTicket(tenant.id)
			ticketRepository.seed([ticket])

			const useCase = new AddTicketMessageUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				senderType: 'user',
				senderId: 'user-123',
				content: 'Test message content',
				tenantId: tenant.id, // API route context
			})

			expect(result.id).toBeDefined()
			expect(result.ticketId).toBe(ticket.id)
			expect(result.senderType).toBe('user')
			expect(result.content).toBe('Test message content')
		})

		it('should add manager message to ticket', async () => {
			const ticket = createTestTicket(tenant.id)
			ticketRepository.seed([ticket])

			const useCase = new AddTicketMessageUseCase(ticketRepository, tenantRepository)

			const result = await useCase.execute({
				ticketId: ticket.id,
				senderType: 'manager',
				senderId: 'manager-123',
				content: 'Response from support',
				userRole: 'owner',
				userId: 'owner-id',
			})

			expect(result.senderType).toBe('manager')
		})

		it('should throw NotFoundError when ticket does not exist', async () => {
			const useCase = new AddTicketMessageUseCase(ticketRepository, tenantRepository)

			await expect(
				useCase.execute({
					ticketId: 'non-existent-id',
					senderType: 'user',
					content: 'Test message',
					tenantId: tenant.id,
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw BadRequestError when content is empty', async () => {
			const ticket = createTestTicket(tenant.id)
			ticketRepository.seed([ticket])

			const useCase = new AddTicketMessageUseCase(ticketRepository, tenantRepository)

			await expect(
				useCase.execute({
					ticketId: ticket.id,
					senderType: 'user',
					content: '',
					tenantId: tenant.id,
				}),
			).rejects.toThrow(BadRequestError)
		})
	})
})
