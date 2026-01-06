/**
 * Test data factories for creating mock entities
 */

import type { User } from "@/db/schema/users";
import type { Subscription } from "@/db/schema/subscriptions";
import type { Plan } from "@/db/schema/plans";
import type { PendingPayment } from "@/db/schema/pending-payments";
import { generateTestEmail, randomString } from "./test-utils";

/**
 * Create a mock user with default values
 */
export function createMockUser(overrides?: Partial<User>): User {
	return {
		id: overrides?.id || `user-${randomString()}`,
		email: overrides?.email || generateTestEmail("user"),
		name: overrides?.name || "Test User",
		password: overrides?.password || "$2b$12$hashedpassword123",
		isEmailVerified: overrides?.isEmailVerified ?? false,
		verificationSecret: overrides?.verificationSecret || null,
		verificationExpiresAt: overrides?.verificationExpiresAt || null,
		verificationResendCount: overrides?.verificationResendCount ?? 0,
		verificationLastResendAt: overrides?.verificationLastResendAt || null,
		createdAt: overrides?.createdAt || new Date(),
		updatedAt: overrides?.updatedAt || new Date(),
	};
}

/**
 * Create a verified user
 */
export function createVerifiedUser(overrides?: Partial<User>): User {
	return createMockUser({
		isEmailVerified: true,
		verificationSecret: null,
		verificationExpiresAt: null,
		...overrides,
	});
}

/**
 * Create an unverified user with verification code
 */
export function createUnverifiedUser(overrides?: Partial<User>): User {
	return createMockUser({
		isEmailVerified: false,
		verificationSecret: "secret-123",
		verificationExpiresAt: new Date(Date.now() + 300000), // 5 minutes
		...overrides,
	});
}

/**
 * Create a mock plan
 */
export function createMockPlan(overrides?: Partial<Plan>): Plan {
	return {
		id: overrides?.id || `plan-${randomString()}`,
		name: overrides?.name || "Basic Plan",
		slug: overrides?.slug || "basico",
		description: overrides?.description || "Basic plan description",
		price: overrides?.price || 9990, // cents
		durationDays: overrides?.durationDays || 30,
		maxUsers: overrides?.maxUsers || 1,
		maxManagers: overrides?.maxManagers || 0,
		maxSerasaQueries: overrides?.maxSerasaQueries || 100,
		allowsLateCharges: overrides?.allowsLateCharges || 0,
		features: overrides?.features || [],
		createdAt: overrides?.createdAt || new Date(),
		updatedAt: overrides?.updatedAt || new Date(),
	};
}

/**
 * Create Basic plan
 */
export function createBasicPlan(overrides?: Partial<Plan>): Plan {
	return createMockPlan({
		name: "Plano Básico",
		slug: "basico",
		price: 9990, // R$ 99.90 in cents
		maxUsers: 1,
		maxManagers: 0,
		maxSerasaQueries: 100,
		allowsLateCharges: 0,
		features: [],
		...overrides,
	});
}

/**
 * Create Imobiliaria plan
 */
export function createImobiliariaPlan(overrides?: Partial<Plan>): Plan {
	return createMockPlan({
		name: "Plano Imobiliária",
		slug: "imobiliaria",
		price: 29990, // R$ 299.90 in cents
		maxUsers: 5,
		maxManagers: 0,
		maxSerasaQueries: 500,
		allowsLateCharges: 1,
		features: ["lateCharges", "multipleUsers"],
		...overrides,
	});
}

/**
 * Create House plan
 */
export function createHousePlan(overrides?: Partial<Plan>): Plan {
	return createMockPlan({
		name: "Plano House",
		slug: "house",
		price: 99990, // R$ 999.90 in cents
		maxUsers: 20,
		maxManagers: 5,
		maxSerasaQueries: 2000,
		allowsLateCharges: 1,
		features: ["lateCharges", "multipleUsers", "managers"],
		...overrides,
	});
}

/**
 * Create a mock subscription
 */
export function createMockSubscription(
	overrides?: Partial<Subscription>,
): Subscription {
	const now = new Date();
	const endDate = new Date(now);
	endDate.setMonth(endDate.getMonth() + 1);

	return {
		id: overrides?.id || `sub-${randomString()}`,
		userId: overrides?.userId || `user-${randomString()}`,
		planId: overrides?.planId || `plan-${randomString()}`,
		status: overrides?.status || "active",
		startDate: overrides?.startDate || now,
		endDate: overrides?.endDate || endDate,
		createdAt: overrides?.createdAt || now,
		updatedAt: overrides?.updatedAt || now,
	};
}

/**
 * Create an active subscription
 */
export function createActiveSubscription(
	overrides?: Partial<Subscription>,
): Subscription {
	const now = new Date();
	const endDate = new Date(now);
	endDate.setMonth(endDate.getMonth() + 1);

	return createMockSubscription({
		status: "active",
		startDate: now,
		endDate,
		...overrides,
	});
}

/**
 * Create a pending subscription
 */
export function createPendingSubscription(
	overrides?: Partial<Subscription>,
): Subscription {
	return createMockSubscription({
		status: "pending",
		endDate: null,
		...overrides,
	});
}

/**
 * Create an expired subscription
 */
export function createExpiredSubscription(
	overrides?: Partial<Subscription>,
): Subscription {
	const now = new Date();
	const startDate = new Date(now);
	startDate.setMonth(startDate.getMonth() - 2);
	const endDate = new Date(now);
	endDate.setMonth(endDate.getMonth() - 1);

	return createMockSubscription({
		status: "expired",
		startDate,
		endDate,
		...overrides,
	});
}

/**
 * Create a canceled subscription
 */
export function createCanceledSubscription(
	overrides?: Partial<Subscription>,
): Subscription {
	const now = new Date();
	const startDate = new Date(now);
	startDate.setMonth(startDate.getMonth() - 1);

	return createMockSubscription({
		status: "canceled",
		startDate,
		endDate: now,
		...overrides,
	});
}

/**
 * Create a mock pending payment
 */
export function createMockPendingPayment(
	overrides?: Partial<PendingPayment>,
): PendingPayment {
	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setMinutes(expiresAt.getMinutes() + 30);

	return {
		id: overrides?.id || `payment-${randomString()}`,
		email: overrides?.email || generateTestEmail("payment"),
		name: overrides?.name || "Payment User",
		password: overrides?.password || "$2b$12$hashedpassword123",
		planId: overrides?.planId || `plan-${randomString()}`,
		pagarmeOrderId: overrides?.pagarmeOrderId || null,
		pagarmeChargeId: overrides?.pagarmeChargeId || null,
		status: overrides?.status || "pending",
		expiresAt: overrides?.expiresAt || expiresAt,
		createdAt: overrides?.createdAt || now,
		updatedAt: overrides?.updatedAt || now,
	};
}

/**
 * Create an expired pending payment
 */
export function createExpiredPendingPayment(
	overrides?: Partial<PendingPayment>,
): PendingPayment {
	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setMinutes(expiresAt.getMinutes() - 5);

	return createMockPendingPayment({
		expiresAt,
		...overrides,
	});
}

/**
 * Create a complete user setup with subscription and plan
 */
export function createCompleteUserSetup(overrides?: {
	user?: Partial<User>;
	plan?: Partial<Plan>;
	subscription?: Partial<Subscription>;
}): {
	user: User;
	plan: Plan;
	subscription: Subscription;
} {
	const user = createVerifiedUser(overrides?.user);
	const plan = createBasicPlan(overrides?.plan);
	const subscription = createActiveSubscription({
		userId: user.id,
		planId: plan.id,
		...overrides?.subscription,
	});

	return { user, plan, subscription };
}
