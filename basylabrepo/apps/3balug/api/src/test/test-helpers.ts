import { mock } from 'bun:test'
import type { ICompanyRepository } from '@/repositories/contracts/company.repository'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { JwtUtils } from '@/utils/jwt.utils'

/**
 * Generates a test access token for E2E tests.
 * This is a wrapper around JwtUtils.generateToken that handles async properly.
 */
export async function generateTestToken(
	userId: string,
	options?: { role?: string; companyId?: string | null },
): Promise<string> {
	const token = await JwtUtils.generateToken(userId, 'access', {
		role: options?.role ?? 'owner',
		companyId: options?.companyId ?? null,
	})
	return token
}

export async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateTestEmail(prefix = 'test'): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
}

export function randomString(length = 10): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length)
}

export function stripTime(date: Date): Date {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

export function addHours(date: Date, hours: number): Date {
	const result = new Date(date)
	result.setHours(result.getHours() + hours)
	return result
}

export function addMinutes(date: Date, minutes: number): Date {
	const result = new Date(date)
	result.setMinutes(result.getMinutes() + minutes)
	return result
}

export function addSeconds(date: Date, seconds: number): Date {
	const result = new Date(date)
	result.setSeconds(result.getSeconds() + seconds)
	return result
}

export function datesEqual(date1: Date, date2: Date): boolean {
	return Math.abs(date1.getTime() - date2.getTime()) < 1000
}

export function isErrorOfType<T extends Error>(
	error: unknown,
	errorClass: new (...args: never[]) => T,
): error is T {
	return error instanceof errorClass
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}
	return String(error)
}

export function assertDefined<T>(
	value: T | null | undefined,
	message = 'Value is not defined',
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(message)
	}
}

export function createSpy<T extends Record<string, (...args: unknown[]) => unknown>>(
	obj: T,
): T & { _calls: Record<keyof T, unknown[][]> } {
	const calls: Record<keyof T, unknown[][]> = {} as Record<keyof T, unknown[][]>

	const proxy = new Proxy(obj, {
		get(target, prop) {
			if (prop === '_calls') return calls

			const original = target[prop as keyof T]
			if (typeof original === 'function') {
				return (...args: unknown[]) => {
					if (!calls[prop as keyof T]) {
						calls[prop as keyof T] = []
					}
					calls[prop as keyof T].push(args)
					return original.apply(target, args)
				}
			}
			return original
		},
	})

	return proxy as T & { _calls: Record<keyof T, unknown[][]> }
}

/**
 * Creates an authenticated user with active subscription for E2E testing.
 * Returns the user, subscription, credentials, and an access token.
 *
 * @example
 * ```ts
 * const { user, token } = await createAuthenticatedUser(
 *   userRepository,
 *   planRepository,
 *   subscriptionRepository
 * );
 *
 * const authClient = createAuthenticatedClient(token);
 * const { data } = await authClient.users.me.get();
 * ```
 */
export async function createAuthenticatedUser(
	userRepository: IUserRepository,
	planRepository: IPlanRepository,
	subscriptionRepository: ISubscriptionRepository,
	overrides?: {
		email?: string
		password?: string
		name?: string
		planId?: string
		role?: string
	},
) {
	const email = overrides?.email ?? generateTestEmail('auth-user')
	const password = overrides?.password ?? 'TestPassword123!'
	const name = overrides?.name ?? 'Test User'
	const role = overrides?.role ?? 'owner'

	const plans = await planRepository.findAll()
	const planId = overrides?.planId ?? plans[0]?.id

	if (!planId) {
		throw new Error('No plans available for test setup')
	}

	const user = await userRepository.create({
		email,
		password,
		name,
		role,
		isEmailVerified: true,
		verificationSecret: null,
		verificationExpiresAt: null,
	})

	const now = new Date()
	const endDate = addDays(now, 30)

	const subscription = await subscriptionRepository.create({
		userId: user.id,
		planId,
		status: 'active' as const,
		startDate: now,
		endDate,
	})

	// Generate access token for authenticated requests
	const token = await generateTestToken(user.id, { role: user.role })

	return {
		user,
		subscription,
		email,
		password,
		token,
	}
}

export function createMockUserRepository(): IUserRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByEmail: mock(() => Promise.resolve(null)),
		findByCompanyId: mock(() => Promise.resolve([])),
		create: mock(),
		update: mock(),
		delete: mock(() => Promise.resolve(true)),
		deleteByEmail: mock(() => Promise.resolve(true)),
		registerWithTransaction: mock(),
	}
}

export function createMockSubscriptionRepository(): ISubscriptionRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByUserId: mock(() => Promise.resolve(null)),
		findActiveByUserId: mock(() => Promise.resolve(null)),
		findCurrentByUserId: mock(() => Promise.resolve(null)),
		create: mock(),
		update: mock(),
		delete: mock(() => Promise.resolve(true)),
	}
}

export function createMockPlanRepository(): IPlanRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findBySlug: mock(() => Promise.resolve(null)),
		findAll: mock(() => Promise.resolve([])),
		create: mock(),
		update: mock(),
		delete: mock(() => Promise.resolve(true)),
	}
}

export function createMockPendingPaymentRepository(): IPendingPaymentRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByEmail: mock(() => Promise.resolve(null)),
		findByOrderId: mock(() => Promise.resolve(null)),
		create: mock(),
		update: mock(),
		delete: mock(() => Promise.resolve(true)),
		deleteExpired: mock(() => Promise.resolve(0)),
		processPaymentWithTransaction: mock(),
	}
}

export function createMockCompanyRepository(): ICompanyRepository {
	return {
		findById: mock(() => Promise.resolve(null)),
		findByOwnerId: mock(() => Promise.resolve(null)),
		findByCnpj: mock(() => Promise.resolve(null)),
		create: mock(),
		update: mock(),
		delete: mock(() => Promise.resolve(true)),
		listByOwner: mock(() => Promise.resolve([])),
	}
}
