import { mock } from 'bun:test'
import type { PendingPayment } from '@/db/schema/pending-payments'
import type { Plan } from '@/db/schema/plans'
import type { Subscription } from '@/db/schema/subscriptions'
import type { User } from '@/db/schema/users'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const createMockUser = (): User => ({
	id: 'mock-user-id',
	email: 'mock@example.com',
	password: 'hashed-password',
	name: 'Mock User',
	isEmailVerified: false,
	verificationSecret: null,
	verificationExpiresAt: null,
	verificationAttempts: 0,
	verificationLastAttemptAt: null,
	verificationResendCount: 0,
	verificationLastResendAt: null,
	passwordResetSecret: null,
	passwordResetExpiresAt: null,
	passwordResetResendCount: 0,
	passwordResetCooldownEndsAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
})

const createMockSubscription = (): Subscription => ({
	id: 'mock-subscription-id',
	userId: 'mock-user-id',
	planId: 'mock-plan-id',
	status: 'active',
	startDate: new Date(),
	endDate: null,
	createdAt: new Date(),
	updatedAt: new Date(),
})

const createMockPlan = (): Plan => ({
	id: 'mock-plan-id',
	name: 'Mock Plan',
	slug: 'mock-plan',
	description: 'Mock plan description',
	price: 1000,
	durationDays: 30,
	maxUsers: null,
	maxManagers: 0,
	maxSerasaQueries: 100,
	allowsLateCharges: 0,
	features: [],
	pagarmePlanId: null,
	createdAt: new Date(),
	updatedAt: new Date(),
})

const createMockPendingPayment = (): PendingPayment => ({
	id: 'mock-pending-payment-id',
	email: 'mock@example.com',
	password: 'hashed-password',
	name: 'Mock User',
	planId: 'mock-plan-id',
	pagarmeOrderId: null,
	pagarmeChargeId: null,
	status: 'pending',
	expiresAt: new Date(Date.now() + 30 * 60 * 1000),
	createdAt: new Date(),
	updatedAt: new Date(),
})

export function createMockUserRepository(): IUserRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByEmail: mock(() => Promise.resolve(null)),
		create: mock(() => Promise.resolve(createMockUser())),
		update: mock(() => Promise.resolve(createMockUser())),
		delete: mock(() => Promise.resolve(true)),
		deleteByEmail: mock(() => Promise.resolve(true)),
	}
}

export function createMockSubscriptionRepository(): ISubscriptionRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByUserId: mock(() => Promise.resolve(null)),
		findActiveByUserId: mock(() => Promise.resolve(null)),
		findCurrentByUserId: mock(() => Promise.resolve(null)),
		create: mock(() => Promise.resolve(createMockSubscription())),
		update: mock(() => Promise.resolve(createMockSubscription())),
		delete: mock(() => Promise.resolve(true)),
	}
}

export function createMockPlanRepository(): IPlanRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findBySlug: mock(() => Promise.resolve(null)),
		findAll: mock(() => Promise.resolve([])),
		create: mock(() => Promise.resolve(createMockPlan())),
		update: mock(() => Promise.resolve(createMockPlan())),
		delete: mock(() => Promise.resolve(true)),
	}
}

export function createMockPendingPaymentRepository(): IPendingPaymentRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByEmail: mock(() => Promise.resolve(null)),
		findByOrderId: mock(() => Promise.resolve(null)),
		create: mock(() => Promise.resolve(createMockPendingPayment())),
		update: mock(() => Promise.resolve(createMockPendingPayment())),
		delete: mock(() => Promise.resolve(true)),
		deleteExpired: mock(() => Promise.resolve(0)),
	}
}
