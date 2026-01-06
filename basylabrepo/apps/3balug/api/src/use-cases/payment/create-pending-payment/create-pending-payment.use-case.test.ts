import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { PasswordUtils, RandomUtils } from '@basylab/core/crypto'
import { EmailAlreadyExistsError, PlanNotFoundError, WeakPasswordError } from '@basylab/core/errors'
import { Sanitizers, Validators } from '@basylab/core/validation'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { PendingPayment } from '@/types/pending-payment'
import type { Plan } from '@/types/plan'
import { CreatePendingPaymentUseCase } from './create-pending-payment.use-case'

// Use spyOn instead of mock.module to avoid global module pollution
const mockHashPassword = spyOn(PasswordUtils, 'hash').mockResolvedValue('$2b$10$hashedPassword')
const mockValidatePasswordStrength = spyOn(Validators, 'validatePasswordStrength').mockReturnValue(
	[],
)
const mockGenerateUUID = spyOn(RandomUtils, 'generateUUID').mockReturnValue('mock-uuid')
const mockGenerateSecureString = spyOn(RandomUtils, 'generateSecureString').mockReturnValue(
	'mock-secure-string',
)
const mockGeneratePassword = spyOn(RandomUtils, 'generatePassword').mockReturnValue('mock-password')
const mockSanitizeName = spyOn(Sanitizers, 'sanitizeName').mockImplementation((name: string) =>
	name.trim(),
)
const mockSanitizeEmail = spyOn(Sanitizers, 'sanitizeEmail').mockImplementation((email: string) =>
	email.toLowerCase().trim(),
)

// Restore original implementations after all tests
afterAll(() => {
	mockHashPassword.mockRestore()
	mockValidatePasswordStrength.mockRestore()
	mockGenerateUUID.mockRestore()
	mockGenerateSecureString.mockRestore()
	mockGeneratePassword.mockRestore()
	mockSanitizeName.mockRestore()
	mockSanitizeEmail.mockRestore()
})

describe('CreatePendingPaymentUseCase', () => {
	let userRepository: IUserRepository
	let planRepository: IPlanRepository
	let pendingPaymentRepository: IPendingPaymentRepository
	let createPendingPaymentUseCase: CreatePendingPaymentUseCase

	const mockPlan: Plan = {
		id: 'plan-123',
		name: 'Plano Premium',
		slug: 'plano-premium',
		description: 'Plano completo',
		price: 9900,
		durationDays: 30,
		maxUsers: 10,
		maxManagers: 5,
		maxSerasaQueries: 100,
		allowsLateCharges: 1,
		features: ['feature1'],
		pagarmePlanId: 'plan_pagarme_123',
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	beforeEach(() => {
		mockHashPassword.mockClear()
		mockValidatePasswordStrength.mockClear()
		mockGenerateUUID.mockClear()
		mockGenerateSecureString.mockClear()
		mockGeneratePassword.mockClear()
		mockSanitizeName.mockClear()
		mockSanitizeEmail.mockClear()

		mockHashPassword.mockResolvedValue('$2b$10$hashedPassword')
		mockValidatePasswordStrength.mockReturnValue([])

		userRepository = {
			findByEmail: mock(() => Promise.resolve(null)),
		} as unknown as IUserRepository

		planRepository = {
			findById: mock(() => Promise.resolve({ ...mockPlan })),
		} as unknown as IPlanRepository

		pendingPaymentRepository = {
			findByEmail: mock(() => Promise.resolve(null)),
			create: mock(() =>
				Promise.resolve({
					id: 'pending-123',
					email: 'newuser@example.com',
					password: '$2b$10$hashedPassword',
					name: 'New User',
					planId: 'plan-123',
					pagarmeOrderId: null,
					pagarmeChargeId: null,
					status: 'pending',
					expiresAt: new Date(Date.now() + 1800000),
					createdAt: new Date(),
					updatedAt: new Date(),
				} as PendingPayment),
			),
		} as unknown as IPendingPaymentRepository

		createPendingPaymentUseCase = new CreatePendingPaymentUseCase(
			userRepository,
			planRepository,
			pendingPaymentRepository,
		)
	})

	describe('Fluxo de sucesso', () => {
		it('deve criar pagamento pendente com senha hasheada', async () => {
			const result = await createPendingPaymentUseCase.execute({
				email: 'newuser@example.com',
				password: 'StrongP@ss123',
				name: 'New User',
				planId: 'plan-123',
			})

			expect(result.pendingPaymentId).toBe('pending-123')
			expect(result.expiresAt).toBeDefined()

			expect(mockValidatePasswordStrength).toHaveBeenCalledWith('StrongP@ss123')
			expect(mockHashPassword).toHaveBeenCalledWith('StrongP@ss123')
			expect(userRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com')
			expect(planRepository.findById).toHaveBeenCalledWith('plan-123')

			expect(pendingPaymentRepository.create).toHaveBeenCalledWith({
				email: 'newuser@example.com',
				password: '$2b$10$hashedPassword',
				name: 'New User',
				planId: 'plan-123',
				status: 'pending',
				expiresAt: expect.any(Date),
			})
		})

		it('deve definir expiração de 30 minutos', async () => {
			const beforeCall = Date.now()

			await createPendingPaymentUseCase.execute({
				email: 'newuser@example.com',
				password: 'StrongP@ss123',
				name: 'New User',
				planId: 'plan-123',
			})

			const createCall = (pendingPaymentRepository.create as any).mock.calls[0][0]
			const expiresAt = createCall.expiresAt as Date

			const afterCall = Date.now()
			const expectedExpiration = beforeCall + 30 * 60 * 1000 // 30 minutes

			expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiration - 1000)
			expect(expiresAt.getTime()).toBeLessThanOrEqual(afterCall + 30 * 60 * 1000 + 1000)
		})
	})

	describe('Pagamento pendente existente', () => {
		it('deve retornar pagamento existente se ainda válido', async () => {
			const existingPendingPayment: PendingPayment = {
				id: 'existing-123',
				email: 'newuser@example.com',
				password: '$2b$10$hashedPassword',
				name: 'New User',
				planId: 'plan-123',
				pagarmeOrderId: null,
				pagarmeChargeId: null,
				processedWebhookId: null,
				status: 'pending',
				expiresAt: new Date(Date.now() + 900000), // 15 minutes from now
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			pendingPaymentRepository.findByEmail = mock(() => Promise.resolve(existingPendingPayment))

			const result = await createPendingPaymentUseCase.execute({
				email: 'newuser@example.com',
				password: 'StrongP@ss123',
				name: 'New User',
				planId: 'plan-123',
			})

			expect(result.pendingPaymentId).toBe('existing-123')
			expect(pendingPaymentRepository.create).not.toHaveBeenCalled()
		})

		it('deve criar novo pagamento se existente expirou', async () => {
			const expiredPendingPayment: PendingPayment = {
				id: 'expired-123',
				email: 'newuser@example.com',
				password: '$2b$10$hashedPassword',
				name: 'New User',
				planId: 'plan-123',
				pagarmeOrderId: null,
				pagarmeChargeId: null,
				processedWebhookId: null,
				status: 'pending',
				expiresAt: new Date(Date.now() - 1000), // 1 second ago (expired)
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			pendingPaymentRepository.findByEmail = mock(() => Promise.resolve(expiredPendingPayment))

			const result = await createPendingPaymentUseCase.execute({
				email: 'newuser@example.com',
				password: 'StrongP@ss123',
				name: 'New User',
				planId: 'plan-123',
			})

			expect(result.pendingPaymentId).toBe('pending-123')
			expect(pendingPaymentRepository.create).toHaveBeenCalled()
		})

		it('deve criar novo pagamento se existente não está pendente', async () => {
			const paidPendingPayment: PendingPayment = {
				id: 'paid-123',
				email: 'newuser@example.com',
				password: '$2b$10$hashedPassword',
				name: 'New User',
				planId: 'plan-123',
				pagarmeOrderId: null,
				pagarmeChargeId: null,
				processedWebhookId: null,
				status: 'paid',
				expiresAt: new Date(Date.now() + 900000),
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			pendingPaymentRepository.findByEmail = mock(() => Promise.resolve(paidPendingPayment))

			const result = await createPendingPaymentUseCase.execute({
				email: 'newuser@example.com',
				password: 'StrongP@ss123',
				name: 'New User',
				planId: 'plan-123',
			})

			expect(result.pendingPaymentId).toBe('pending-123')
			expect(pendingPaymentRepository.create).toHaveBeenCalled()
		})
	})

	describe('Validações de erro', () => {
		it('deve lançar erro se email já existe', async () => {
			userRepository.findByEmail = mock(() =>
				Promise.resolve({ id: 'user-123', isEmailVerified: true } as any),
			)

			await expect(
				createPendingPaymentUseCase.execute({
					email: 'existing@example.com',
					password: 'StrongP@ss123',
					name: 'New User',
					planId: 'plan-123',
				}),
			).rejects.toThrow(EmailAlreadyExistsError)
		})

		it('deve lançar erro se senha for fraca', async () => {
			mockValidatePasswordStrength.mockReturnValue(['mínimo 8 caracteres', 'letra maiúscula'])

			await expect(
				createPendingPaymentUseCase.execute({
					email: 'newuser@example.com',
					password: 'weak',
					name: 'New User',
					planId: 'plan-123',
				}),
			).rejects.toThrow(WeakPasswordError)

			await expect(
				createPendingPaymentUseCase.execute({
					email: 'newuser@example.com',
					password: 'weak',
					name: 'New User',
					planId: 'plan-123',
				}),
			).rejects.toThrow('A senha deve conter: mínimo 8 caracteres, letra maiúscula')
		})

		it('deve lançar erro se plano não existir', async () => {
			planRepository.findById = mock(() => Promise.resolve(null))

			await expect(
				createPendingPaymentUseCase.execute({
					email: 'newuser@example.com',
					password: 'StrongP@ss123',
					name: 'New User',
					planId: 'non-existent',
				}),
			).rejects.toThrow(PlanNotFoundError)
		})
	})

	describe('Validação de senha', () => {
		it('deve validar senha durante criação', async () => {
			await createPendingPaymentUseCase.execute({
				email: 'newuser@example.com',
				password: 'StrongP@ss123',
				name: 'New User',
				planId: 'plan-123',
			})

			expect(mockValidatePasswordStrength).toHaveBeenCalledWith('StrongP@ss123')
			expect(mockHashPassword).toHaveBeenCalledWith('StrongP@ss123')
		})
	})
})
