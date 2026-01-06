import type { Company } from '@/db/schema/companies'
import type { PendingPayment } from '@/db/schema/pending-payments'
import type { Plan } from '@/db/schema/plans'
import type { Subscription } from '@/db/schema/subscriptions'
import type { User } from '@/db/schema/users'
import { USER_ROLES } from '@/types/roles'
import { generateTestEmail } from './test-helpers'

// Use crypto.randomUUID directly to avoid mock interference from tests that mock @basylab/core/crypto
const generateUUID = (): string => crypto.randomUUID()

export function createMockUser(overrides?: Partial<User>): User {
	return {
		id: overrides?.id || generateUUID(),
		email: overrides?.email || generateTestEmail('user'),
		name: overrides?.name || 'Test User',
		password: overrides?.password || '$2b$12$hashedpassword123',
		role: overrides?.role || USER_ROLES.OWNER,
		phone: overrides?.phone || null,
		avatarUrl: overrides?.avatarUrl || null,
		companyId: overrides?.companyId || null,
		createdBy: overrides?.createdBy || null,
		isActive: overrides?.isActive ?? true,
		isEmailVerified: overrides?.isEmailVerified ?? false,
		verificationSecret: overrides?.verificationSecret || null,
		verificationExpiresAt: overrides?.verificationExpiresAt || null,
		verificationAttempts: overrides?.verificationAttempts ?? 0,
		verificationLastAttemptAt: overrides?.verificationLastAttemptAt || null,
		verificationResendCount: overrides?.verificationResendCount ?? 0,
		verificationLastResendAt: overrides?.verificationLastResendAt || null,
		passwordResetSecret: overrides?.passwordResetSecret || null,
		passwordResetExpiresAt: overrides?.passwordResetExpiresAt || null,
		passwordResetResendCount: overrides?.passwordResetResendCount ?? 0,
		passwordResetCooldownEndsAt: overrides?.passwordResetCooldownEndsAt || null,
		passwordResetAttempts: overrides?.passwordResetAttempts ?? 0,
		passwordResetLastAttemptAt: overrides?.passwordResetLastAttemptAt || null,
		passwordResetResendBlocked: overrides?.passwordResetResendBlocked ?? false,
		passwordResetResendBlockedUntil: overrides?.passwordResetResendBlockedUntil || null,
		createdAt: overrides?.createdAt || new Date(),
		updatedAt: overrides?.updatedAt || new Date(),
	}
}

export function createVerifiedUser(overrides?: Partial<User>): User {
	return createMockUser({
		isEmailVerified: true,
		verificationSecret: null,
		verificationExpiresAt: null,
		...overrides,
	})
}

export function createUnverifiedUser(overrides?: Partial<User>): User {
	return createMockUser({
		isEmailVerified: false,
		verificationSecret: 'secret-123',
		verificationExpiresAt: new Date(Date.now() + 300000),
		...overrides,
	})
}

export function createMockPlan(overrides?: Partial<Plan>): Plan {
	return {
		id: overrides?.id || generateUUID(),
		name: overrides?.name || 'Basic Plan',
		slug: overrides?.slug || 'basico',
		description: overrides?.description || 'Basic plan description',
		price: overrides?.price || 9990,
		durationDays: overrides?.durationDays || 30,
		maxUsers: overrides?.maxUsers || 1,
		maxManagers: overrides?.maxManagers || 0,
		maxSerasaQueries: overrides?.maxSerasaQueries || 100,
		allowsLateCharges: overrides?.allowsLateCharges || 0,
		features: overrides?.features || [],
		pagarmePlanId: overrides?.pagarmePlanId || null,
		createdAt: overrides?.createdAt || new Date(),
		updatedAt: overrides?.updatedAt || new Date(),
	}
}

export function createBasicPlan(overrides?: Partial<Plan>): Plan {
	return createMockPlan({
		id: 'plan-basico',
		name: 'Plano Básico',
		slug: 'basico',
		price: 9990,
		maxUsers: 1,
		maxManagers: 0,
		maxSerasaQueries: 100,
		allowsLateCharges: 0,
		features: [],
		...overrides,
	})
}

export function createImobiliariaPlan(overrides?: Partial<Plan>): Plan {
	return createMockPlan({
		id: 'plan-imobiliaria',
		name: 'Plano Imobiliária',
		slug: 'imobiliaria',
		price: 29990,
		maxUsers: 5,
		maxManagers: 0,
		maxSerasaQueries: 500,
		allowsLateCharges: 1,
		features: ['lateCharges', 'multipleUsers'],
		...overrides,
	})
}

export function createHousePlan(overrides?: Partial<Plan>): Plan {
	return createMockPlan({
		id: 'plan-house',
		name: 'Plano House',
		slug: 'house',
		price: 99990,
		maxUsers: 20,
		maxManagers: 5,
		maxSerasaQueries: 2000,
		allowsLateCharges: 1,
		features: ['lateCharges', 'multipleUsers', 'managers'],
		...overrides,
	})
}

export function createMockSubscription(overrides?: Partial<Subscription>): Subscription {
	const now = new Date()
	const endDate = new Date(now)
	endDate.setMonth(endDate.getMonth() + 1)

	return {
		id: overrides?.id || generateUUID(),
		userId: overrides?.userId || generateUUID(),
		planId: overrides?.planId || generateUUID(),
		status: overrides?.status || 'active',
		startDate: overrides?.startDate || now,
		endDate: overrides?.endDate || endDate,
		createdAt: overrides?.createdAt || now,
		updatedAt: overrides?.updatedAt || now,
	}
}

export function createActiveSubscription(overrides?: Partial<Subscription>): Subscription {
	const now = new Date()
	const endDate = new Date(now)
	endDate.setMonth(endDate.getMonth() + 1)

	return createMockSubscription({
		status: 'active',
		startDate: now,
		endDate,
		...overrides,
	})
}

export function createPendingSubscription(overrides?: Partial<Subscription>): Subscription {
	return createMockSubscription({
		status: 'pending',
		endDate: null,
		...overrides,
	})
}

export function createExpiredSubscription(overrides?: Partial<Subscription>): Subscription {
	const now = new Date()
	const startDate = new Date(now)
	startDate.setMonth(startDate.getMonth() - 2)
	const endDate = new Date(now)
	endDate.setMonth(endDate.getMonth() - 1)

	return createMockSubscription({
		status: 'expired',
		startDate,
		endDate,
		...overrides,
	})
}

export function createCanceledSubscription(overrides?: Partial<Subscription>): Subscription {
	const now = new Date()
	const startDate = new Date(now)
	startDate.setMonth(startDate.getMonth() - 1)

	return createMockSubscription({
		status: 'canceled',
		startDate,
		endDate: now,
		...overrides,
	})
}

export function createMockPendingPayment(overrides?: Partial<PendingPayment>): PendingPayment {
	const now = new Date()
	const expiresAt = new Date(now)
	expiresAt.setMinutes(expiresAt.getMinutes() + 30)

	return {
		id: overrides?.id || generateUUID(),
		email: overrides?.email || generateTestEmail('payment'),
		name: overrides?.name || 'Payment User',
		password: overrides?.password || '$2b$12$hashedpassword123',
		planId: overrides?.planId || generateUUID(),
		pagarmeOrderId: overrides?.pagarmeOrderId || null,
		pagarmeChargeId: overrides?.pagarmeChargeId || null,
		processedWebhookId: overrides?.processedWebhookId || null,
		status: overrides?.status || 'pending',
		expiresAt: overrides?.expiresAt || expiresAt,
		createdAt: overrides?.createdAt || now,
		updatedAt: overrides?.updatedAt || now,
	}
}

export function createExpiredPendingPayment(overrides?: Partial<PendingPayment>): PendingPayment {
	const now = new Date()
	const expiresAt = new Date(now)
	expiresAt.setMinutes(expiresAt.getMinutes() - 5)

	return createMockPendingPayment({
		expiresAt,
		...overrides,
	})
}

export function createCompleteUserSetup(overrides?: {
	user?: Partial<User>
	plan?: Partial<Plan>
	subscription?: Partial<Subscription>
}): {
	user: User
	plan: Plan
	subscription: Subscription
} {
	const user = createVerifiedUser(overrides?.user)
	const plan = createBasicPlan(overrides?.plan)
	const subscription = createActiveSubscription({
		userId: user.id,
		planId: plan.id,
		...overrides?.subscription,
	})

	return { user, plan, subscription }
}

export function createMockCompany(overrides?: Partial<Company>): Company {
	return {
		id: overrides?.id || generateUUID(),
		name: overrides?.name || 'Test Company',
		cnpj: overrides?.cnpj || null,
		ownerId: overrides?.ownerId ?? null,
		email: overrides?.email || generateTestEmail('company'),
		phone: overrides?.phone || null,
		address: overrides?.address || null,
		city: overrides?.city || null,
		state: overrides?.state || null,
		zipCode: overrides?.zipCode || null,
		settings: overrides?.settings || {},
		createdAt: overrides?.createdAt || new Date(),
		updatedAt: overrides?.updatedAt || new Date(),
	}
}
