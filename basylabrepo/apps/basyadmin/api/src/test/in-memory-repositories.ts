import type {
	BillingRecord,
	Event,
	Feature,
	NewBillingRecord,
	NewEvent,
	NewFeature,
	NewPlan,
	NewTenant,
	NewTicket,
	NewTicketMessage,
	NewUser,
	Plan,
	PlanFeature,
	Tenant,
	Ticket,
	TicketMessage,
	User,
} from '@/db/schema'
import type {
	BillingFilters,
	BillingListResult,
	BillingStats,
	IBillingRepository,
} from '@/repositories/contracts/billing.repository'
import type {
	EventAggregate,
	EventFilters,
	EventListResult,
	IEventRepository,
} from '@/repositories/contracts/event.repository'
import type {
	FeatureFilters,
	FeatureListResult,
	IFeatureRepository,
} from '@/repositories/contracts/feature.repository'
import type {
	IPlanRepository,
	PlanFilters,
	PlanListResult,
	PlanWithFeatures,
} from '@/repositories/contracts/plan.repository'
import type {
	ITenantRepository,
	TenantFilters,
	TenantListResult,
} from '@/repositories/contracts/tenant.repository'
import type {
	ITicketRepository,
	TicketFilters,
	TicketListResult,
	TicketWithMessages,
} from '@/repositories/contracts/ticket.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const generateUUID = (): string => crypto.randomUUID()

// ==================== User Repository ====================

export class InMemoryUserRepository implements IUserRepository {
	private users: Map<string, User> = new Map()

	async findById(id: string): Promise<User | null> {
		return this.users.get(id) ?? null
	}

	async findByEmail(email: string): Promise<User | null> {
		for (const user of this.users.values()) {
			if (user.email === email) {
				return user
			}
		}
		return null
	}

	async findManagers(): Promise<User[]> {
		const result: User[] = []
		for (const user of this.users.values()) {
			if (user.role === 'manager') {
				result.push(user)
			}
		}
		return result
	}

	async create(data: NewUser): Promise<User> {
		const user: User = {
			id: generateUUID(),
			email: data.email,
			passwordHash: data.passwordHash,
			name: data.name,
			role: data.role,
			isActive: data.isActive ?? true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.users.set(user.id, user)
		return user
	}

	async update(id: string, data: Partial<NewUser>): Promise<User | null> {
		const existing = this.users.get(id)
		if (!existing) return null

		const updated: User = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.users.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.users.delete(id)
	}

	clear(): void {
		this.users.clear()
	}

	seed(users: User[]): void {
		for (const user of users) {
			this.users.set(user.id, user)
		}
	}
}

// ==================== Tenant Repository ====================

export class InMemoryTenantRepository implements ITenantRepository {
	private tenants: Map<string, Tenant> = new Map()
	private userTenants: Map<string, Set<string>> = new Map() // managerId -> Set<tenantId>

	async findById(id: string): Promise<Tenant | null> {
		return this.tenants.get(id) ?? null
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		for (const tenant of this.tenants.values()) {
			if (tenant.slug === slug) {
				return tenant
			}
		}
		return null
	}

	async findByApiKey(apiKey: string): Promise<Tenant | null> {
		for (const tenant of this.tenants.values()) {
			if (tenant.apiKey === apiKey) {
				return tenant
			}
		}
		return null
	}

	async findAll(): Promise<Tenant[]> {
		return Array.from(this.tenants.values())
	}

	async findByManagerId(managerId: string): Promise<Tenant[]> {
		const tenantIds = this.userTenants.get(managerId)
		if (!tenantIds) return []

		const result: Tenant[] = []
		for (const tenantId of tenantIds) {
			const tenant = this.tenants.get(tenantId)
			if (tenant) {
				result.push(tenant)
			}
		}
		return result
	}

	async list(filters: TenantFilters): Promise<TenantListResult> {
		let result = Array.from(this.tenants.values())

		if (filters.search) {
			const search = filters.search.toLowerCase()
			result = result.filter(
				(t) => t.name.toLowerCase().includes(search) || t.slug.toLowerCase().includes(search),
			)
		}

		const total = result.length
		const limit = filters.limit ?? 20
		const offset = filters.offset ?? 0

		return {
			data: result.slice(offset, offset + limit),
			total,
			limit,
			offset,
		}
	}

	async create(data: NewTenant): Promise<Tenant> {
		const tenant: Tenant = {
			id: generateUUID(),
			name: data.name,
			slug: data.slug,
			logoUrl: data.logoUrl ?? null,
			domain: data.domain ?? null,
			description: data.description ?? null,
			apiKey: data.apiKey,
			apiKeyCreatedAt: data.apiKeyCreatedAt ?? new Date(),
			settings: data.settings ?? {},
			isActive: data.isActive ?? true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.tenants.set(tenant.id, tenant)
		return tenant
	}

	async update(id: string, data: Partial<NewTenant>): Promise<Tenant | null> {
		const existing = this.tenants.get(id)
		if (!existing) return null

		const updated: Tenant = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.tenants.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		// Remove all manager associations
		for (const [managerId, tenantIds] of this.userTenants.entries()) {
			tenantIds.delete(id)
			if (tenantIds.size === 0) {
				this.userTenants.delete(managerId)
			}
		}
		return this.tenants.delete(id)
	}

	async assignManager(tenantId: string, managerId: string): Promise<void> {
		if (!this.userTenants.has(managerId)) {
			this.userTenants.set(managerId, new Set())
		}
		this.userTenants.get(managerId)!.add(tenantId)
	}

	async removeManager(tenantId: string, managerId: string): Promise<void> {
		const tenantIds = this.userTenants.get(managerId)
		if (tenantIds) {
			tenantIds.delete(tenantId)
			if (tenantIds.size === 0) {
				this.userTenants.delete(managerId)
			}
		}
	}

	async isManagerOfTenant(managerId: string, tenantId: string): Promise<boolean> {
		const tenantIds = this.userTenants.get(managerId)
		return tenantIds?.has(tenantId) ?? false
	}

	clear(): void {
		this.tenants.clear()
		this.userTenants.clear()
	}

	seed(tenants: Tenant[]): void {
		for (const tenant of tenants) {
			this.tenants.set(tenant.id, tenant)
		}
	}
}

// ==================== Feature Repository ====================

export class InMemoryFeatureRepository implements IFeatureRepository {
	private features: Map<string, Feature> = new Map()

	async findById(id: string): Promise<Feature | null> {
		return this.features.get(id) ?? null
	}

	async findBySlug(slug: string): Promise<Feature | null> {
		for (const feature of this.features.values()) {
			if (feature.slug === slug) {
				return feature
			}
		}
		return null
	}

	async findAll(): Promise<Feature[]> {
		return Array.from(this.features.values())
	}

	async list(filters: FeatureFilters): Promise<FeatureListResult> {
		let result = Array.from(this.features.values())

		if (filters.search) {
			const search = filters.search.toLowerCase()
			result = result.filter(
				(f) => f.name.toLowerCase().includes(search) || f.slug.toLowerCase().includes(search),
			)
		}

		if (filters.featureType) {
			result = result.filter((f) => f.featureType === filters.featureType)
		}

		const total = result.length
		const limit = filters.limit ?? 20
		const offset = filters.offset ?? 0

		return {
			data: result.slice(offset, offset + limit),
			total,
			limit,
			offset,
		}
	}

	async create(data: NewFeature): Promise<Feature> {
		const feature: Feature = {
			id: generateUUID(),
			name: data.name,
			slug: data.slug,
			description: data.description ?? null,
			featureType: data.featureType ?? 'boolean',
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.features.set(feature.id, feature)
		return feature
	}

	async update(id: string, data: Partial<NewFeature>): Promise<Feature | null> {
		const existing = this.features.get(id)
		if (!existing) return null

		const updated: Feature = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.features.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.features.delete(id)
	}

	clear(): void {
		this.features.clear()
	}

	seed(features: Feature[]): void {
		for (const feature of features) {
			this.features.set(feature.id, feature)
		}
	}
}

// ==================== Plan Repository ====================

export class InMemoryPlanRepository implements IPlanRepository {
	private plans: Map<string, Plan> = new Map()
	private planFeatures: Map<string, PlanFeature[]> = new Map() // planId -> features
	private featureRepository: InMemoryFeatureRepository | null = null

	setFeatureRepository(repo: InMemoryFeatureRepository): void {
		this.featureRepository = repo
	}

	async findById(id: string): Promise<Plan | null> {
		return this.plans.get(id) ?? null
	}

	async findByIdWithFeatures(id: string): Promise<PlanWithFeatures | null> {
		const plan = this.plans.get(id)
		if (!plan) return null

		const features = this.planFeatures.get(id) ?? []
		const featuresWithDetails: PlanWithFeatures['features'] = []

		for (const pf of features) {
			if (this.featureRepository) {
				const feature = await this.featureRepository.findById(pf.featureId)
				if (feature) {
					featuresWithDetails.push({
						featureId: pf.featureId,
						featureSlug: feature.slug,
						featureName: feature.name,
						value: pf.value,
					})
				}
			}
		}

		return {
			...plan,
			features: featuresWithDetails,
		}
	}

	async findByTenantAndSlug(tenantId: string, slug: string): Promise<Plan | null> {
		for (const plan of this.plans.values()) {
			if (plan.tenantId === tenantId && plan.slug === slug) {
				return plan
			}
		}
		return null
	}

	async findByTenantId(tenantId: string): Promise<Plan[]> {
		const result: Plan[] = []
		for (const plan of this.plans.values()) {
			if (plan.tenantId === tenantId) {
				result.push(plan)
			}
		}
		return result
	}

	async list(filters: PlanFilters): Promise<PlanListResult> {
		let result = Array.from(this.plans.values()).filter((p) => p.tenantId === filters.tenantId)

		if (filters.search) {
			const search = filters.search.toLowerCase()
			result = result.filter(
				(p) => p.name.toLowerCase().includes(search) || p.slug.toLowerCase().includes(search),
			)
		}

		if (filters.isActive !== undefined) {
			result = result.filter((p) => p.isActive === filters.isActive)
		}

		const total = result.length
		const limit = filters.limit ?? 20
		const offset = filters.offset ?? 0

		return {
			data: result.slice(offset, offset + limit),
			total,
			limit,
			offset,
		}
	}

	async create(data: NewPlan): Promise<Plan> {
		const plan: Plan = {
			id: generateUUID(),
			tenantId: data.tenantId,
			name: data.name,
			slug: data.slug,
			description: data.description ?? null,
			priceCents: data.priceCents,
			currency: data.currency ?? 'BRL',
			billingInterval: data.billingInterval ?? 'monthly',
			isActive: data.isActive ?? true,
			displayOrder: data.displayOrder ?? 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.plans.set(plan.id, plan)
		this.planFeatures.set(plan.id, [])
		return plan
	}

	async update(id: string, data: Partial<NewPlan>): Promise<Plan | null> {
		const existing = this.plans.get(id)
		if (!existing) return null

		const updated: Plan = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.plans.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		this.planFeatures.delete(id)
		return this.plans.delete(id)
	}

	async assignFeature(planId: string, featureId: string, value?: unknown): Promise<void> {
		const features = this.planFeatures.get(planId) ?? []
		const existingIndex = features.findIndex((f) => f.featureId === featureId)

		const planFeature: PlanFeature = {
			planId,
			featureId,
			value: value ?? true,
		}

		if (existingIndex >= 0) {
			features[existingIndex] = planFeature
		} else {
			features.push(planFeature)
		}

		this.planFeatures.set(planId, features)
	}

	async removeFeature(planId: string, featureId: string): Promise<void> {
		const features = this.planFeatures.get(planId) ?? []
		const filtered = features.filter((f) => f.featureId !== featureId)
		this.planFeatures.set(planId, filtered)
	}

	async getPlanFeatures(planId: string): Promise<PlanFeature[]> {
		return this.planFeatures.get(planId) ?? []
	}

	clear(): void {
		this.plans.clear()
		this.planFeatures.clear()
	}

	seed(plans: Plan[]): void {
		for (const plan of plans) {
			this.plans.set(plan.id, plan)
			this.planFeatures.set(plan.id, [])
		}
	}
}

// ==================== Event Repository ====================

export class InMemoryEventRepository implements IEventRepository {
	private events: Map<string, Event> = new Map()

	async findById(id: string): Promise<Event | null> {
		return this.events.get(id) ?? null
	}

	async findByFilters(filters: EventFilters): Promise<EventListResult> {
		let result = Array.from(this.events.values())

		if (filters.tenantId) {
			result = result.filter((e) => e.tenantId === filters.tenantId)
		}

		if (filters.eventName) {
			result = result.filter((e) => e.eventName === filters.eventName)
		}

		if (filters.userId) {
			result = result.filter((e) => e.userId === filters.userId)
		}

		if (filters.startDate) {
			result = result.filter((e) => e.createdAt && e.createdAt >= filters.startDate!)
		}

		if (filters.endDate) {
			result = result.filter((e) => e.createdAt && e.createdAt <= filters.endDate!)
		}

		const total = result.length
		const limit = filters.limit ?? 100
		const offset = filters.offset ?? 0

		return {
			data: result.slice(offset, offset + limit),
			total,
			limit,
			offset,
		}
	}

	async create(data: NewEvent): Promise<Event> {
		const event: Event = {
			id: generateUUID(),
			tenantId: data.tenantId,
			eventName: data.eventName,
			userId: data.userId ?? null,
			properties: data.properties ?? {},
			createdAt: new Date(),
		}
		this.events.set(event.id, event)
		return event
	}

	async createBatch(data: NewEvent[]): Promise<Event[]> {
		const results: Event[] = []
		for (const item of data) {
			const event = await this.create(item)
			results.push(event)
		}
		return results
	}

	async aggregate(tenantId: string, startDate?: Date, endDate?: Date): Promise<EventAggregate[]> {
		let events = Array.from(this.events.values()).filter((e) => e.tenantId === tenantId)

		if (startDate) {
			events = events.filter((e) => e.createdAt && e.createdAt >= startDate)
		}

		if (endDate) {
			events = events.filter((e) => e.createdAt && e.createdAt <= endDate)
		}

		const aggregates = new Map<string, { count: number; users: Set<string> }>()

		for (const event of events) {
			if (!aggregates.has(event.eventName)) {
				aggregates.set(event.eventName, { count: 0, users: new Set() })
			}
			const agg = aggregates.get(event.eventName)!
			agg.count++
			if (event.userId) {
				agg.users.add(event.userId)
			}
		}

		const result: EventAggregate[] = []
		for (const [eventName, data] of aggregates) {
			result.push({
				eventName,
				count: data.count,
				uniqueUsers: data.users.size,
			})
		}

		return result
	}

	async countByTenant(tenantId: string): Promise<number> {
		let count = 0
		for (const event of this.events.values()) {
			if (event.tenantId === tenantId) {
				count++
			}
		}
		return count
	}

	clear(): void {
		this.events.clear()
	}

	seed(events: Event[]): void {
		for (const event of events) {
			this.events.set(event.id, event)
		}
	}
}

// ==================== Billing Repository ====================

export class InMemoryBillingRepository implements IBillingRepository {
	private records: Map<string, BillingRecord> = new Map()

	async findById(id: string): Promise<BillingRecord | null> {
		return this.records.get(id) ?? null
	}

	async findByFilters(filters: BillingFilters): Promise<BillingListResult> {
		let result = Array.from(this.records.values())

		if (filters.tenantId) {
			result = result.filter((r) => r.tenantId === filters.tenantId)
		}

		if (filters.status) {
			result = result.filter((r) => r.status === filters.status)
		}

		if (filters.startDate) {
			result = result.filter((r) => r.createdAt && r.createdAt >= filters.startDate!)
		}

		if (filters.endDate) {
			result = result.filter((r) => r.createdAt && r.createdAt <= filters.endDate!)
		}

		const total = result.length
		const limit = filters.limit ?? 100
		const offset = filters.offset ?? 0

		return {
			data: result.slice(offset, offset + limit),
			total,
			limit,
			offset,
		}
	}

	async create(data: NewBillingRecord): Promise<BillingRecord> {
		const record: BillingRecord = {
			id: generateUUID(),
			tenantId: data.tenantId,
			externalCustomerId: data.externalCustomerId ?? null,
			customerEmail: data.customerEmail ?? null,
			planSlug: data.planSlug ?? null,
			amountCents: data.amountCents,
			currency: data.currency ?? 'BRL',
			status: data.status,
			paidAt: data.paidAt ?? null,
			metadata: data.metadata ?? {},
			createdAt: new Date(),
		}
		this.records.set(record.id, record)
		return record
	}

	async update(id: string, data: Partial<NewBillingRecord>): Promise<BillingRecord | null> {
		const existing = this.records.get(id)
		if (!existing) return null

		const updated: BillingRecord = {
			...existing,
			...data,
		}
		this.records.set(id, updated)
		return updated
	}

	async getStats(tenantId?: string, startDate?: Date, endDate?: Date): Promise<BillingStats> {
		let records = Array.from(this.records.values())

		if (tenantId) {
			records = records.filter((r) => r.tenantId === tenantId)
		}

		if (startDate) {
			records = records.filter((r) => r.createdAt && r.createdAt >= startDate)
		}

		if (endDate) {
			records = records.filter((r) => r.createdAt && r.createdAt <= endDate)
		}

		let totalRevenue = 0
		let paidTransactions = 0
		let failedTransactions = 0

		for (const record of records) {
			totalRevenue += record.amountCents
			if (record.status === 'paid') {
				paidTransactions++
			}
			if (record.status === 'failed') {
				failedTransactions++
			}
		}

		return {
			totalRevenue,
			totalTransactions: records.length,
			paidTransactions,
			failedTransactions,
		}
	}

	async getMRR(tenantId?: string): Promise<number> {
		const now = new Date()
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

		let records = Array.from(this.records.values()).filter(
			(r) => r.status === 'paid' && r.paidAt && r.paidAt >= thirtyDaysAgo && r.paidAt <= now,
		)

		if (tenantId) {
			records = records.filter((r) => r.tenantId === tenantId)
		}

		let total = 0
		for (const record of records) {
			total += record.amountCents
		}

		return total
	}

	clear(): void {
		this.records.clear()
	}

	seed(records: BillingRecord[]): void {
		for (const record of records) {
			this.records.set(record.id, record)
		}
	}
}

// ==================== Ticket Repository ====================

export class InMemoryTicketRepository implements ITicketRepository {
	private tickets: Map<string, Ticket> = new Map()
	private messages: Map<string, TicketMessage[]> = new Map() // ticketId -> messages

	async findById(id: string): Promise<Ticket | null> {
		return this.tickets.get(id) ?? null
	}

	async findByIdWithMessages(id: string): Promise<TicketWithMessages | null> {
		const ticket = this.tickets.get(id)
		if (!ticket) return null

		return {
			...ticket,
			messages: this.messages.get(id) ?? [],
		}
	}

	async findByTenantId(tenantId: string): Promise<Ticket[]> {
		const result: Ticket[] = []
		for (const ticket of this.tickets.values()) {
			if (ticket.tenantId === tenantId) {
				result.push(ticket)
			}
		}
		return result
	}

	async findByTenantIds(tenantIds: string[]): Promise<Ticket[]> {
		const result: Ticket[] = []
		for (const ticket of this.tickets.values()) {
			if (tenantIds.includes(ticket.tenantId)) {
				result.push(ticket)
			}
		}
		return result
	}

	async findAll(): Promise<Ticket[]> {
		return Array.from(this.tickets.values())
	}

	async list(filters: TicketFilters): Promise<TicketListResult> {
		let result = Array.from(this.tickets.values())

		if (filters.tenantId) {
			result = result.filter((t) => t.tenantId === filters.tenantId)
		}

		if (filters.tenantIds && filters.tenantIds.length > 0) {
			result = result.filter((t) => filters.tenantIds!.includes(t.tenantId))
		}

		if (filters.status) {
			result = result.filter((t) => t.status === filters.status)
		}

		if (filters.priority) {
			result = result.filter((t) => t.priority === filters.priority)
		}

		if (filters.assignedTo) {
			result = result.filter((t) => t.assignedTo === filters.assignedTo)
		}

		const total = result.length
		const limit = filters.limit ?? 20
		const offset = filters.offset ?? 0

		return {
			data: result.slice(offset, offset + limit),
			total,
			limit,
			offset,
		}
	}

	async create(data: NewTicket): Promise<Ticket> {
		const ticket: Ticket = {
			id: generateUUID(),
			tenantId: data.tenantId,
			externalUserId: data.externalUserId ?? null,
			externalUserEmail: data.externalUserEmail ?? null,
			title: data.title,
			description: data.description ?? null,
			priority: data.priority ?? 'medium',
			status: data.status ?? 'open',
			category: data.category ?? null,
			metadata: data.metadata ?? {},
			assignedTo: data.assignedTo ?? null,
			resolvedAt: data.resolvedAt ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.tickets.set(ticket.id, ticket)
		this.messages.set(ticket.id, [])
		return ticket
	}

	async update(id: string, data: Partial<NewTicket>): Promise<Ticket | null> {
		const existing = this.tickets.get(id)
		if (!existing) return null

		const updated: Ticket = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.tickets.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		this.messages.delete(id)
		return this.tickets.delete(id)
	}

	async getMessages(ticketId: string): Promise<TicketMessage[]> {
		return this.messages.get(ticketId) ?? []
	}

	async addMessage(data: NewTicketMessage): Promise<TicketMessage> {
		const message: TicketMessage = {
			id: generateUUID(),
			ticketId: data.ticketId,
			senderType: data.senderType,
			senderId: data.senderId ?? null,
			content: data.content,
			attachments: data.attachments ?? [],
			createdAt: new Date(),
		}

		const messages = this.messages.get(data.ticketId) ?? []
		messages.push(message)
		this.messages.set(data.ticketId, messages)

		return message
	}

	clear(): void {
		this.tickets.clear()
		this.messages.clear()
	}

	seed(tickets: Ticket[]): void {
		for (const ticket of tickets) {
			this.tickets.set(ticket.id, ticket)
			this.messages.set(ticket.id, [])
		}
	}
}

// ==================== Test Factory ====================

export function createTestRepositories() {
	const userRepository = new InMemoryUserRepository()
	const tenantRepository = new InMemoryTenantRepository()
	const featureRepository = new InMemoryFeatureRepository()
	const planRepository = new InMemoryPlanRepository()
	const eventRepository = new InMemoryEventRepository()
	const billingRepository = new InMemoryBillingRepository()
	const ticketRepository = new InMemoryTicketRepository()

	// Wire up dependencies
	planRepository.setFeatureRepository(featureRepository)

	return {
		userRepository,
		tenantRepository,
		featureRepository,
		planRepository,
		eventRepository,
		billingRepository,
		ticketRepository,
		clearAll: () => {
			userRepository.clear()
			tenantRepository.clear()
			featureRepository.clear()
			planRepository.clear()
			eventRepository.clear()
			billingRepository.clear()
			ticketRepository.clear()
		},
	}
}
