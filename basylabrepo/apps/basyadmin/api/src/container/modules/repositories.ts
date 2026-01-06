import { db } from '@/db'
import type { IBillingRepository } from '@/repositories/contracts/billing.repository'
import type { IEventRepository } from '@/repositories/contracts/event.repository'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { ITicketRepository } from '@/repositories/contracts/ticket.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { BillingDrizzleRepository } from '@/repositories/providers/drizzle/billing.repository'
import { EventDrizzleRepository } from '@/repositories/providers/drizzle/event.repository'
import { FeatureDrizzleRepository } from '@/repositories/providers/drizzle/feature.repository'
import { PlanDrizzleRepository } from '@/repositories/providers/drizzle/plan.repository'
import { TenantDrizzleRepository } from '@/repositories/providers/drizzle/tenant.repository'
import { TicketDrizzleRepository } from '@/repositories/providers/drizzle/ticket.repository'
import { UserDrizzleRepository } from '@/repositories/providers/drizzle/user.repository'

export interface Repositories {
	userRepository: IUserRepository
	tenantRepository: ITenantRepository
	featureRepository: IFeatureRepository
	planRepository: IPlanRepository
	eventRepository: IEventRepository
	billingRepository: IBillingRepository
	ticketRepository: ITicketRepository
}

export const repositories: Repositories = {
	userRepository: new UserDrizzleRepository(db),
	tenantRepository: new TenantDrizzleRepository(db),
	featureRepository: new FeatureDrizzleRepository(db),
	planRepository: new PlanDrizzleRepository(db),
	eventRepository: new EventDrizzleRepository(db),
	billingRepository: new BillingDrizzleRepository(db),
	ticketRepository: new TicketDrizzleRepository(db),
}

// Convenience exports for direct access
export const userRepository = repositories.userRepository
export const tenantRepository = repositories.tenantRepository
export const featureRepository = repositories.featureRepository
export const planRepository = repositories.planRepository
export const eventRepository = repositories.eventRepository
export const billingRepository = repositories.billingRepository
export const ticketRepository = repositories.ticketRepository
