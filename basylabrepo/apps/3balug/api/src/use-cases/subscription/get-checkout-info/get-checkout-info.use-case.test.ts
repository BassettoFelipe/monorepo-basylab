import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
	EmailNotVerifiedError,
	OperationNotAllowedError,
	SubscriptionNotFoundError,
	UserNotFoundError,
} from '@basylab/core/errors'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { CheckoutTokenPayload } from '@/utils/jwt.utils'
import { GetCheckoutInfoUseCase } from './get-checkout-info.use-case'

const mockCheckoutPayload: CheckoutTokenPayload = {
	sub: 'user-123',
	exp: Date.now() / 1000 + 3600,
	iat: Date.now() / 1000,
	purpose: 'checkout',
	user: {
		name: 'Test User',
		email: 'user@test.com',
	},
	subscription: {
		id: 'sub-123',
		status: 'pending',
	},
	plan: {
		id: 'plan-123',
		name: 'Premium',
		price: 99.9,
		features: ['feature1', 'feature2'],
	},
}

describe('GetCheckoutInfoUseCase', () => {
	let useCase: GetCheckoutInfoUseCase
	let mockUserRepository: IUserRepository
	let mockSubscriptionRepository: ISubscriptionRepository

	beforeEach(() => {
		mockUserRepository = {
			findById: mock(() =>
				Promise.resolve({
					id: 'user-123',
					email: 'user@test.com',
					name: 'Test User',
					isEmailVerified: true,
				}),
			),
		} as any

		mockSubscriptionRepository = {
			findById: mock(() =>
				Promise.resolve({
					id: 'sub-123',
					status: 'pending',
					planId: 'plan-123',
				}),
			),
		} as any

		useCase = new GetCheckoutInfoUseCase(mockUserRepository, mockSubscriptionRepository)
	})

	describe('Casos de Sucesso', () => {
		test('deve retornar informações de checkout com payload válido', async () => {
			const result = await useCase.execute({
				userId: 'user-123',
				checkoutPayload: mockCheckoutPayload,
			})

			expect(result).toBeDefined()
			expect(result.user).toBeDefined()
			expect(result.user.name).toBe('Test User')
			expect(result.user.email).toBe('user@test.com')
			expect(result.subscription).toBeDefined()
			expect(result.subscription.id).toBe('sub-123')
			expect(result.plan).toBeDefined()
			expect(result.plan.id).toBe('plan-123')
			expect(result.plan.name).toBe('Premium')
		})

		test('deve verificar que usuário existe e está verificado', async () => {
			await useCase.execute({
				userId: 'user-123',
				checkoutPayload: mockCheckoutPayload,
			})

			expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123')
		})

		test('deve verificar que subscription existe e está pending', async () => {
			await useCase.execute({
				userId: 'user-123',
				checkoutPayload: mockCheckoutPayload,
			})

			expect(mockSubscriptionRepository.findById).toHaveBeenCalledWith('sub-123')
		})

		test('deve retornar todos os dados do payload', async () => {
			const result = await useCase.execute({
				userId: 'user-123',
				checkoutPayload: mockCheckoutPayload,
			})

			expect(result.user.email).toBe('user@test.com')
			expect(result.user.name).toBe('Test User')
			expect(result.subscription.status).toBe('pending')
			expect(result.plan.price).toBe(99.9)
		})
	})

	describe('Validações de Usuário', () => {
		test('deve rejeitar quando usuário não existe', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce(null)

			await expect(
				useCase.execute({
					userId: 'user-123',
					checkoutPayload: mockCheckoutPayload,
				}),
			).rejects.toThrow(UserNotFoundError)
		})

		test('deve rejeitar quando email não está verificado', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-123',
				email: 'user@test.com',
				isEmailVerified: false,
			})

			await expect(
				useCase.execute({
					userId: 'user-123',
					checkoutPayload: mockCheckoutPayload,
				}),
			).rejects.toThrow(EmailNotVerifiedError)
		})

		test('deve aceitar usuário com email verificado', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-123',
				email: 'user@test.com',
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				userId: 'user-123',
				checkoutPayload: mockCheckoutPayload,
			})

			expect(result).toBeDefined()
		})
	})

	describe('Validações de Subscription', () => {
		test('deve rejeitar quando subscription não existe', async () => {
			;(mockSubscriptionRepository.findById as any).mockResolvedValueOnce(null)

			await expect(
				useCase.execute({
					userId: 'user-123',
					checkoutPayload: mockCheckoutPayload,
				}),
			).rejects.toThrow(SubscriptionNotFoundError)
		})

		test('deve rejeitar quando subscription não está pending', async () => {
			;(mockSubscriptionRepository.findById as any).mockResolvedValueOnce({
				id: 'sub-123',
				status: 'active',
			})

			await expect(
				useCase.execute({
					userId: 'user-123',
					checkoutPayload: mockCheckoutPayload,
				}),
			).rejects.toThrow(OperationNotAllowedError)
		})

		test('deve rejeitar quando subscription está cancelled', async () => {
			;(mockSubscriptionRepository.findById as any).mockResolvedValueOnce({
				id: 'sub-123',
				status: 'cancelled',
			})

			await expect(
				useCase.execute({
					userId: 'user-123',
					checkoutPayload: mockCheckoutPayload,
				}),
			).rejects.toThrow('Esta assinatura já foi processada')
		})

		test('deve aceitar subscription pending', async () => {
			;(mockSubscriptionRepository.findById as any).mockResolvedValueOnce({
				id: 'sub-123',
				status: 'pending',
			})

			const result = await useCase.execute({
				userId: 'user-123',
				checkoutPayload: mockCheckoutPayload,
			})

			expect(result).toBeDefined()
		})
	})
})
