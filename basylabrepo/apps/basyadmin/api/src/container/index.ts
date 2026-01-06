import type { IBillingRepository } from '@/repositories/contracts/billing.repository'
import type { IEventRepository } from '@/repositories/contracts/event.repository'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { ITicketRepository } from '@/repositories/contracts/ticket.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { createAuthUseCases } from './modules/auth.module'
import { createBillingUseCases } from './modules/billing.module'
import { createEventUseCases } from './modules/events.module'
import { createFeatureUseCases } from './modules/features.module'
import { createManagerUseCases } from './modules/managers.module'
import { createPlanUseCases } from './modules/plans.module'
import { repositories } from './modules/repositories'
import { createTenantUseCases } from './modules/tenants.module'
import { createTicketUseCases } from './modules/tickets.module'

export const auth = createAuthUseCases()
export const tenants = createTenantUseCases()
export const features = createFeatureUseCases()
export const plans = createPlanUseCases()
export const events = createEventUseCases()
export const billing = createBillingUseCases()
export const tickets = createTicketUseCases()
export const managers = createManagerUseCases()

export const container = {
	get userRepository() {
		return repositories.userRepository
	},
	get tenantRepository() {
		return repositories.tenantRepository
	},
	get featureRepository() {
		return repositories.featureRepository
	},
	get planRepository() {
		return repositories.planRepository
	},
	get eventRepository() {
		return repositories.eventRepository
	},
	get billingRepository() {
		return repositories.billingRepository
	},
	get ticketRepository() {
		return repositories.ticketRepository
	},
	auth,
	tenants,
	features,
	plans,
	events,
	billing,
	tickets,
	managers,
}

export function injectTestRepositories(repos: {
	userRepository?: IUserRepository
	tenantRepository?: ITenantRepository
	featureRepository?: IFeatureRepository
	planRepository?: IPlanRepository
	eventRepository?: IEventRepository
	billingRepository?: IBillingRepository
	ticketRepository?: ITicketRepository
}): void {
	if (repos.userRepository) repositories.userRepository = repos.userRepository
	if (repos.tenantRepository) repositories.tenantRepository = repos.tenantRepository
	if (repos.featureRepository) repositories.featureRepository = repos.featureRepository
	if (repos.planRepository) repositories.planRepository = repos.planRepository
	if (repos.eventRepository) repositories.eventRepository = repos.eventRepository
	if (repos.billingRepository) repositories.billingRepository = repos.billingRepository
	if (repos.ticketRepository) repositories.ticketRepository = repos.ticketRepository

	// Recria os use-cases com os novos repositórios
	Object.assign(auth, createAuthUseCases())
	Object.assign(tenants, createTenantUseCases())
	Object.assign(features, createFeatureUseCases())
	Object.assign(plans, createPlanUseCases())
	Object.assign(events, createEventUseCases())
	Object.assign(billing, createBillingUseCases())
	Object.assign(tickets, createTicketUseCases())
	Object.assign(managers, createManagerUseCases())
}
