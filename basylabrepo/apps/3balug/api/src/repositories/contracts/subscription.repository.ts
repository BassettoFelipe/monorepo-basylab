import type { Plan } from '@/db/schema/plans'
import type { NewSubscription, Subscription } from '@/db/schema/subscriptions'

export type SubscriptionStatus = 'active' | 'pending' | 'canceled' | 'expired'

export interface CurrentSubscription extends Subscription {
	plan: Plan
	computedStatus: SubscriptionStatus
	daysRemaining: number | null
}

export interface ISubscriptionRepository {
	findById(id: string): Promise<Subscription | null>
	findByUserId(userId: string): Promise<Subscription | null>
	findActiveByUserId(userId: string): Promise<Subscription | null>
	findCurrentByUserId(userId: string): Promise<CurrentSubscription | null>
	create(data: NewSubscription): Promise<Subscription>
	update(id: string, data: Partial<NewSubscription>): Promise<Subscription | null>
	delete(id: string): Promise<boolean>
}
