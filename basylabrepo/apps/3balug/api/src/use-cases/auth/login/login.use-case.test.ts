import { afterAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import {
	EmailNotVerifiedError,
	InvalidCredentialsError,
	SubscriptionRequiredError,
} from '@basylab/core/errors'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { JwtUtils } from '@/utils/jwt.utils'
import { LoginUseCase } from './login.use-case'

// Use spyOn instead of mock.module to avoid global module pollution
const mockVerifyPassword = spyOn(PasswordUtils, 'verify').mockResolvedValue(true)
const mockGenerateToken = spyOn(JwtUtils, 'generateToken').mockResolvedValue('mock-token')
const mockParseExpirationToSeconds = spyOn(JwtUtils, 'parseExpirationToSeconds').mockReturnValue(
	1800,
)

// Restore original implementations after all tests
afterAll(() => {
	mockVerifyPassword.mockRestore()
	mockGenerateToken.mockRestore()
	mockParseExpirationToSeconds.mockRestore()
})

describe('LoginUseCase', () => {
	let useCase: LoginUseCase
	let mockUserRepository: IUserRepository
	let mockSubscriptionRepository: ISubscriptionRepository
	let mockCustomFieldRepository: ICustomFieldRepository
	let mockPlanFeatureRepository: any

	const validInput = {
		email: 'test@example.com',
		password: 'ValidP@ss123',
	}

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		password: '$2b$12$hashedpassword',
		role: 'owner' as const,
		phone: null,
		avatarUrl: null,
		companyId: null,
		createdBy: null,
		isActive: true,
		isEmailVerified: true,
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
		passwordResetResendBlocked: false,
		passwordResetResendBlockedUntil: null,
		passwordResetAttempts: 0,
		passwordResetLastAttemptAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	const mockSubscription = {
		id: 'sub-123',
		userId: 'user-123',
		planId: 'plan-123',
		status: 'active' as const,
		startDate: new Date(),
		endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
		computedStatus: 'active' as const,
		plan: {
			id: 'plan-123',
			name: 'Basic Plan',
			slug: 'basico',
			description: null,
			price: 9990,
			durationDays: 30,
			maxUsers: null,
			maxManagers: 0,
			maxSerasaQueries: 0,
			allowsLateCharges: 0,
			features: ['feature1'],
			pagarmePlanId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		daysRemaining: 30,
	}

	beforeEach(() => {
		mockVerifyPassword.mockClear()
		mockGenerateToken.mockClear()
		mockParseExpirationToSeconds.mockClear()

		mockVerifyPassword.mockResolvedValue(true)
		mockGenerateToken.mockResolvedValue('mock-token')
		mockParseExpirationToSeconds.mockReturnValue(1800)

		mockUserRepository = {
			findById: mock(() => Promise.resolve(null)),
			findByEmail: mock(() => Promise.resolve(mockUser)),
			findByCompanyId: mock(() => Promise.resolve([])),
			create: mock(() => Promise.resolve(mockUser)),
			update: mock(() => Promise.resolve(mockUser)),
			delete: mock(() => Promise.resolve(true)),
			deleteByEmail: mock(() => Promise.resolve(true)),
			registerWithTransaction: mock(() => Promise.resolve(mockUser)) as any,
		}

		mockSubscriptionRepository = {
			findById: mock(() => Promise.resolve(null)),
			findByUserId: mock(() => Promise.resolve(null)),
			findActiveByUserId: mock(() => Promise.resolve(null)),
			findCurrentByUserId: mock(() => Promise.resolve(mockSubscription)),
			create: mock(() => Promise.resolve(mockSubscription)),
			update: mock(() => Promise.resolve(mockSubscription)),
			delete: mock(() => Promise.resolve(true)),
		}

		mockCustomFieldRepository = {
			findById: mock(() => Promise.resolve(null)),
			findByCompanyId: mock(() => Promise.resolve([])),
			findActiveByCompanyId: mock(() => Promise.resolve([])),
			create: mock(() => Promise.resolve({} as never)),
			update: mock(() => Promise.resolve({} as never)),
			delete: mock(() => Promise.resolve(true)),
			reorder: mock(() => Promise.resolve()),
			hasUserPendingRequiredFields: mock(() => Promise.resolve(false)),
		}

		mockPlanFeatureRepository = {
			planHasFeature: mock(() => Promise.resolve(false)),
			getPlanFeatures: mock(() => Promise.resolve([])),
			getPlansWithFeature: mock(() => Promise.resolve([])),
		}

		useCase = new LoginUseCase(
			mockUserRepository,
			mockSubscriptionRepository,
			mockCustomFieldRepository,
			mockPlanFeatureRepository,
		)
	})

	describe('User Validation', () => {
		test('should throw InvalidCredentialsError when user does not exist', async () => {
			mockUserRepository.findByEmail = mock(() => Promise.resolve(null))

			await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)
		})

		test('should throw InvalidCredentialsError for non-existent user', async () => {
			mockUserRepository.findByEmail = mock(() => Promise.resolve(null))

			await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)
		})

		test('should query user by email', async () => {
			await useCase.execute(validInput)

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email)
		})
	})

	describe('Password Validation', () => {
		test('should throw InvalidCredentialsError when password is incorrect', async () => {
			mockVerifyPassword.mockResolvedValue(false)

			await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)
		})

		test('should throw InvalidCredentialsError for wrong password', async () => {
			mockVerifyPassword.mockResolvedValue(false)

			await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)
		})

		test('should verify password with CryptoUtils', async () => {
			await useCase.execute(validInput)

			expect(mockVerifyPassword).toHaveBeenCalledWith(validInput.password, mockUser.password)
		})

		test('should use same error for non-existent user and wrong password', async () => {
			mockUserRepository.findByEmail = mock(() => Promise.resolve(null))
			let error1: unknown
			try {
				await useCase.execute(validInput)
			} catch (e) {
				error1 = e
			}

			mockUserRepository.findByEmail = mock(() => Promise.resolve(mockUser))
			mockVerifyPassword.mockResolvedValue(false)
			let error2: unknown
			try {
				await useCase.execute(validInput)
			} catch (e) {
				error2 = e
			}

			if (!(error1 instanceof InvalidCredentialsError)) {
				throw new Error('Expected InvalidCredentialsError for missing user')
			}
			if (!(error2 instanceof InvalidCredentialsError)) {
				throw new Error('Expected InvalidCredentialsError for wrong password')
			}
			expect(error1.message).toBe(error2.message)
		})
	})

	describe('Email Verification Check', () => {
		test('should throw EmailNotVerifiedError when email is not verified', async () => {
			const unverifiedUser = { ...mockUser, isEmailVerified: false }
			mockUserRepository.findByEmail = mock(() => Promise.resolve(unverifiedUser))

			await expect(useCase.execute(validInput)).rejects.toThrow(EmailNotVerifiedError)
		})

		test('should throw EmailNotVerifiedError for unverified email', async () => {
			const unverifiedUser = { ...mockUser, isEmailVerified: false }
			mockUserRepository.findByEmail = mock(() => Promise.resolve(unverifiedUser))

			try {
				await useCase.execute(validInput)
				expect(true).toBe(false)
			} catch (error) {
				expect(error).toBeInstanceOf(EmailNotVerifiedError)
			}
		})

		test('should include email in error metadata when email is not verified', async () => {
			const unverifiedUser = { ...mockUser, isEmailVerified: false }
			mockUserRepository.findByEmail = mock(() => Promise.resolve(unverifiedUser))

			try {
				await useCase.execute(validInput)
				expect(true).toBe(false)
			} catch (error: unknown) {
				if (!(error instanceof EmailNotVerifiedError)) {
					throw error
				}
				expect(error.metadata).toBeDefined()
				const metadata = error.metadata
				if (!metadata) {
					throw new Error('Missing error metadata')
				}
				expect(metadata.email).toBe(unverifiedUser.email)
			}
		})

		test('should allow login when email is verified', async () => {
			const result = await useCase.execute(validInput)

			expect(result).toBeDefined()
			expect(result.user.id).toBe(mockUser.id)
		})

		test('should throw ForbiddenError when user is not active', async () => {
			const inactiveUser = { ...mockUser, isActive: false }
			mockUserRepository.findByEmail = mock(() => Promise.resolve(inactiveUser))

			await expect(useCase.execute(validInput)).rejects.toThrow(
				'Sua conta foi desativada. Entre em contato com o administrador da sua empresa para mais informações.',
			)
		})
	})

	describe('Subscription Validation', () => {
		test('should throw SubscriptionRequiredError when user has no subscription', async () => {
			mockSubscriptionRepository.findCurrentByUserId = mock(() => Promise.resolve(null))

			await expect(useCase.execute(validInput)).rejects.toThrow(SubscriptionRequiredError)
		})

		test('should throw SubscriptionRequiredError when subscription not found', async () => {
			mockSubscriptionRepository.findCurrentByUserId = mock(() => Promise.resolve(null))

			try {
				await useCase.execute(validInput)
				expect(true).toBe(false)
			} catch (error) {
				expect(error).toBeInstanceOf(SubscriptionRequiredError)
			}
		})

		test('should query subscription by user ID', async () => {
			await useCase.execute(validInput)

			expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith(mockUser.id)
		})
	})

	describe('Token Generation', () => {
		test('should generate access and refresh tokens', async () => {
			await useCase.execute(validInput)

			expect(mockGenerateToken).toHaveBeenCalledWith(mockUser.id, 'access', expect.any(Object))
			expect(mockGenerateToken).toHaveBeenCalledWith(mockUser.id, 'refresh', expect.any(Object))
		})

		test('should generate checkout token for pending subscription', async () => {
			const pendingSubscription = {
				...mockSubscription,
				status: 'pending' as const,
				computedStatus: 'pending' as const,
			}
			mockSubscriptionRepository.findCurrentByUserId = mock(() =>
				Promise.resolve(pendingSubscription),
			)

			await useCase.execute(validInput)

			const checkoutCall = mockGenerateToken.mock.calls.find(
				(call) => (call as unknown[])[1] === 'checkout',
			) as unknown as [string, string, Record<string, unknown>] | undefined
			expect(checkoutCall).toBeDefined()
			if (checkoutCall) {
				expect(checkoutCall[0]).toBe(mockUser.id)
				expect(checkoutCall[2]).toHaveProperty('purpose', 'checkout')
				expect(checkoutCall[2]).toHaveProperty('user')
				expect(checkoutCall[2]).toHaveProperty('subscription')
				expect(checkoutCall[2]).toHaveProperty('plan')
			}
		})

		test('should not generate checkout token for active subscription', async () => {
			await useCase.execute(validInput)

			const checkoutCall = mockGenerateToken.mock.calls.find(
				(call) => (call as unknown[])[1] === 'checkout',
			)
			expect(checkoutCall).toBeUndefined()
		})
	})

	describe('Return Values', () => {
		test('should return correct user data', async () => {
			const result = await useCase.execute(validInput)

			expect(result.user).toEqual({
				id: mockUser.id,
				email: mockUser.email,
				name: mockUser.name,
				role: mockUser.role,
				hasPendingCustomFields: false,
			})
		})

		test('should return correct subscription data', async () => {
			const result = await useCase.execute(validInput)

			expect(result.subscription).toEqual({
				id: mockSubscription.id,
				status: mockSubscription.computedStatus,
				startDate: mockSubscription.startDate,
				endDate: mockSubscription.endDate,
				plan: {
					id: mockSubscription.plan.id,
					name: mockSubscription.plan.name,
					price: mockSubscription.plan.price,
					features: mockSubscription.plan.features,
				},
				daysRemaining: mockSubscription.daysRemaining,
			})
		})

		test('should return access and refresh tokens', async () => {
			const result = await useCase.execute(validInput)

			expect(result.accessToken).toBe('mock-token')
			expect(result.refreshToken).toBe('mock-token')
		})

		test('should return checkout token and expiration for pending subscription', async () => {
			const pendingSubscription = {
				...mockSubscription,
				status: 'pending' as const,
				computedStatus: 'pending' as const,
			}
			mockSubscriptionRepository.findCurrentByUserId = mock(() =>
				Promise.resolve(pendingSubscription),
			)

			const result = await useCase.execute(validInput)

			expect(result.checkoutToken).toBeDefined()
			expect(result.checkoutExpiresAt).toBeTruthy()
			const expiresDate = new Date(result.checkoutExpiresAt!)
			const expectedTime = Date.now() + 1800000
			expect(expiresDate.getTime()).toBeGreaterThanOrEqual(expectedTime - 2000)
			expect(expiresDate.getTime()).toBeLessThanOrEqual(expectedTime + 2000)
		})

		test('should not return checkout token for active subscription', async () => {
			const result = await useCase.execute(validInput)

			expect(result.checkoutToken).toBeUndefined()
			expect(result.checkoutExpiresAt).toBeUndefined()
		})
	})

	describe('Complete Flow', () => {
		test('should complete login successfully with active subscription', async () => {
			const result = await useCase.execute(validInput)

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email)
			expect(mockVerifyPassword).toHaveBeenCalled()
			expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalled()
			expect(mockGenerateToken).toHaveBeenCalledTimes(2) // access + refresh

			expect(result.user.id).toBe(mockUser.id)
			expect(result.subscription.id).toBe(mockSubscription.id)
			expect(result.accessToken).toBeDefined()
			expect(result.refreshToken).toBeDefined()
		})

		test('should complete login successfully with pending subscription', async () => {
			const pendingSubscription = {
				...mockSubscription,
				status: 'pending' as const,
				computedStatus: 'pending' as const,
			}
			mockSubscriptionRepository.findCurrentByUserId = mock(() =>
				Promise.resolve(pendingSubscription),
			)

			const result = await useCase.execute(validInput)

			expect(mockGenerateToken).toHaveBeenCalledTimes(3) // access + refresh + checkout
			expect(result.checkoutToken).toBeDefined()
			expect(result.checkoutExpiresAt).toBeDefined()
			expect(new Date(result.checkoutExpiresAt!).getTime()).toBeGreaterThan(Date.now())
		})
	})

	describe('Edge Cases', () => {
		test('should handle expired subscription', async () => {
			const expiredSubscription = {
				...mockSubscription,
				computedStatus: 'expired' as const,
			}
			mockSubscriptionRepository.findCurrentByUserId = mock(() =>
				Promise.resolve(expiredSubscription),
			)

			const result = await useCase.execute(validInput)

			expect(result.subscription.status).toBe('expired')
		})

		test('should handle canceled subscription', async () => {
			const canceledSubscription = {
				...mockSubscription,
				computedStatus: 'canceled' as const,
			}
			mockSubscriptionRepository.findCurrentByUserId = mock(() =>
				Promise.resolve(canceledSubscription),
			)

			const result = await useCase.execute(validInput)

			expect(result.subscription.status).toBe('canceled')
		})

		test('should handle special characters in email', async () => {
			const specialEmail = 'user+tag@example.com'
			await useCase.execute({ ...validInput, email: specialEmail })

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(specialEmail)
		})

		test('should throw InvalidCredentialsError when user has no password', async () => {
			const userWithoutPassword = { ...mockUser, password: null }
			mockUserRepository.findByEmail = mock(() => Promise.resolve(userWithoutPassword))

			await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)
		})

		test('should use subscription from creator when user has no own subscription', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockSubscriptionRepository.findCurrentByUserId = mock((userId: string) =>
				userId === createdUser.id ? Promise.resolve(null) : Promise.resolve(mockSubscription),
			)
			mockUserRepository.findById = mock(() => Promise.resolve({ ...mockUser, id: 'owner-123' }))

			const result = await useCase.execute(validInput)

			expect(result).toBeDefined()
			expect(result.subscription.id).toBe(mockSubscription.id)
		})
	})

	describe('Custom Fields Validation', () => {
		test('should set hasPendingCustomFields to false when no custom fields exist', async () => {
			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(false)
		})

		test('should set hasPendingCustomFields to false when user is owner', async () => {
			const ownerUser = {
				...mockUser,
				createdBy: null,
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(ownerUser))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(false)
		})

		test('should set hasPendingCustomFields to false when plan has no custom fields feature', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(false))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(false)
		})

		test('should set hasPendingCustomFields to true when required fields are not answered', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))
			mockCustomFieldRepository.hasUserPendingRequiredFields = mock(() => Promise.resolve(true))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(true)
		})

		test('should set hasPendingCustomFields to true when no fields are answered at all', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))
			mockCustomFieldRepository.hasUserPendingRequiredFields = mock(() => Promise.resolve(true))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(true)
		})

		test('should set hasPendingCustomFields to false when all required fields are answered', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))
			mockCustomFieldRepository.hasUserPendingRequiredFields = mock(() => Promise.resolve(false))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(false)
		})

		test('should set hasPendingCustomFields to true when required field has empty value', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))
			mockCustomFieldRepository.hasUserPendingRequiredFields = mock(() => Promise.resolve(true))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(true)
		})

		test('should set hasPendingCustomFields to true when required field value is null', async () => {
			const createdUser = {
				...mockUser,
				createdBy: 'owner-123',
				companyId: 'company-123',
			}
			mockUserRepository.findByEmail = mock(() => Promise.resolve(createdUser))
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))
			mockCustomFieldRepository.hasUserPendingRequiredFields = mock(() => Promise.resolve(true))

			const result = await useCase.execute(validInput)

			expect(result.user.hasPendingCustomFields).toBe(true)
		})
	})
})
